"""
GeoSurvey Scientific Engine — SimPEG Inversion Runner
DC resistivity inversion using SimPEG.
Falls back to demo/synthetic results if SimPEG is not installed.
"""

import time
import numpy as np
from typing import Any

from engine.data_loader import SurveyDataLoader
from engine.resistivity import ApparentResistivity
from engine.mesh_utils import MeshGenerator
from engine.visualization_data import VisualizationDataGenerator

try:
    import SimPEG
    from SimPEG import maps, data_misfit, regularization, optimization, inversion, inverse_problem
    from SimPEG.electromagnetics.static import resistivity as dc
    from discretize import TensorMesh
    SIMPEG_AVAILABLE = True
except ImportError:
    SIMPEG_AVAILABLE = False


class SimpegInversionRunner:
    """Run DC resistivity inversion using SimPEG."""

    def run(
        self,
        file_path: str,
        file_format: str,
        array_type: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Execute the full SimPEG inversion pipeline.
        """
        params = params or {}

        # Stub Advanced Methods
        if array_type not in ["wenner", "schlumberger", "dipole_dipole"]:
            return self._run_advanced_stub(array_type, params)

        # Load data for standard DC Resistivity
        loader = SurveyDataLoader()
        data = loader.load(file_path, file_format)
        electrode_positions = data["electrode_positions"]
        measurements = data["measurements"]
        rho_a = data["apparent_resistivity"]

        if not SIMPEG_AVAILABLE:
            return self._run_demo(electrode_positions, measurements, rho_a, array_type, params)

        return self._run_inversion(electrode_positions, measurements, rho_a, array_type, params)

    def _run_advanced_stub(self, array_type: str, params: dict[str, Any]) -> dict[str, Any]:
        """Stub handler for new Gravity, Magnetics, EM, and IP methods."""
        time.sleep(2)  # Simulate processing time
        return {
            "result_data": {
                "message": f"Simulated execution of {array_type}",
                "demo_mode": True,
            },
            "model_data": {
                "status": "under_construction",
                "note": "This SimPEG method is fully registered in the system but the numerical solver is currently a stub.",
            },
            "rms_misfit": 0.0,
            "iterations": 0,
            "plot_data": {},
        }

    def _run_inversion(
        self,
        electrode_positions: np.ndarray,
        measurements: np.ndarray,
        rho_a: np.ndarray,
        array_type: str,
        params: dict[str, Any],
    ) -> dict[str, Any]:
        """Run actual SimPEG inversion (requires SimPEG installed)."""
        start = time.time()

        max_iterations = params.get("max_iterations", 20)
        beta0_ratio = params.get("beta0_ratio", 1.0)

        # Survey geometry
        x_elec = electrode_positions[:, 0]
        survey_length = x_elec.max() - x_elec.min()

        # Create mesh
        mesh_params = MeshGenerator.create_tensor_mesh_2d(survey_length)
        hx = np.array(mesh_params["hx"])
        hz = np.array(mesh_params["hz"])
        mesh = TensorMesh([hx, hz], origin=mesh_params["origin"])

        # Build survey and data objects
        n_data = len(measurements)
        source_list = []
        for i in range(n_data):
            a_idx = int(measurements[i, 0])
            b_idx = int(measurements[i, 1])
            m_idx = int(measurements[i, 2])
            n_idx = int(measurements[i, 3])

            a_loc = electrode_positions[a_idx].reshape(1, -1)[:, :2]
            b_loc = electrode_positions[b_idx].reshape(1, -1)[:, :2]
            m_loc = electrode_positions[m_idx].reshape(1, -1)[:, :2]
            n_loc = electrode_positions[n_idx].reshape(1, -1)[:, :2]

            rx = dc.receivers.Dipole(m_loc, n_loc)
            src = dc.sources.Dipole([rx], a_loc.flatten(), b_loc.flatten())
            source_list.append(src)

        survey = dc.survey.Survey(source_list)

        # Data object
        dobs = rho_a
        std = 0.05 * np.abs(dobs)
        data_obj = SimPEG.data.Data(survey, dobs=dobs, standard_deviation=std)

        # Inversion setup
        model_map = maps.ExpMap(mesh)
        m0 = np.log(np.median(rho_a)) * np.ones(mesh.nC)

        simulation = dc.simulation_2d.Simulation2DNodal(
            mesh, survey=survey, sigmaMap=model_map
        )

        dmis = data_misfit.L2DataMisfit(data=data_obj, simulation=simulation)
        reg = regularization.WeightedLeastSquares(mesh)
        opt = optimization.InexactGaussNewton(maxIter=max_iterations)
        inv_prob = inverse_problem.BaseInvProblem(dmis, reg, opt)
        inv = inversion.BaseInversion(inv_prob)

        # Run inversion
        m_recovered = inv.run(m0)
        rho_recovered = np.exp(m_recovered)

        elapsed = time.time() - start

        # Generate visualization data
        cc = mesh.cell_centers
        viz = VisualizationDataGenerator()
        plot_data = viz.generate_resistivity_section(
            cc[:, 0], cc[:, 1], rho_recovered
        )
        plot_data["pseudosection"] = viz.generate_pseudosection(
            electrode_positions, measurements, rho_a
        )

        return {
            "result_data": {
                "resistivity_model": rho_recovered.tolist(),
                "cell_centers_x": cc[:, 0].tolist(),
                "cell_centers_z": cc[:, 1].tolist(),
            },
            "model_data": {
                "initial_model": "log(median(rho_a))",
                "n_cells": mesh.nC,
                "mesh_type": "TensorMesh",
            },
            "rms_misfit": float(np.sqrt(np.mean((dmis.residual(m_recovered)) ** 2))) if hasattr(dmis, 'residual') else None,
            "chi_squared": None,
            "iterations": max_iterations,
            "output_files": {},
            "plot_data": plot_data,
        }

    def _run_demo(
        self,
        electrode_positions: np.ndarray,
        measurements: np.ndarray,
        rho_a: np.ndarray,
        array_type: str,
        params: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate synthetic demo results when SimPEG is not available."""
        x_elec = electrode_positions[:, 0] if electrode_positions.size > 0 else np.linspace(0, 100, 25)
        survey_length = x_elec.max() - x_elec.min() if x_elec.size > 1 else 100

        # Synthetic mesh
        nx, nz = 60, 20
        x = np.linspace(x_elec.min() - 10, x_elec.max() + 10, nx)
        z = np.linspace(-survey_length / 3, 0, nz)
        X, Z = np.meshgrid(x, z)

        # Synthetic resistivity model — layered with anomaly
        rho = np.ones_like(X) * 100.0  # background
        rho[Z < -5] = 250.0  # second layer
        rho[Z < -15] = 50.0   # third layer

        # Add conductive anomaly
        r = np.sqrt((X - survey_length / 2) ** 2 + (Z + 10) ** 2)
        rho[r < 8] = 10.0

        viz = VisualizationDataGenerator()
        plot_data = viz.generate_resistivity_section(X.flatten(), Z.flatten(), rho.flatten())

        if rho_a.size > 0:
            plot_data["pseudosection"] = viz.generate_pseudosection(
                electrode_positions, measurements, rho_a
            )

        return {
            "result_data": {
                "resistivity_model": rho.flatten().tolist(),
                "cell_centers_x": X.flatten().tolist(),
                "cell_centers_z": Z.flatten().tolist(),
                "demo_mode": True,
            },
            "model_data": {
                "initial_model": "synthetic_layered",
                "n_cells": nx * nz,
                "mesh_type": "RegularGrid",
                "note": "SimPEG not available — demo data generated",
            },
            "rms_misfit": 1.23,
            "chi_squared": 1.05,
            "iterations": 15,
            "output_files": {},
            "plot_data": plot_data,
        }
