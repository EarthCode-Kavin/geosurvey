"""
GeoSurvey Scientific Engine — pyGIMLi Modelling Runner
ERT inversion and modelling using pyGIMLi.
Falls back to demo/synthetic results if pyGIMLi is not installed.
"""

import time
import numpy as np
from typing import Any

from engine.data_loader import SurveyDataLoader
from engine.resistivity import ApparentResistivity
from engine.mesh_utils import MeshGenerator
from engine.visualization_data import VisualizationDataGenerator

try:
    import pygimli as pg
    from pygimli.physics import ert
    PYGIMLI_AVAILABLE = True
except ImportError:
    PYGIMLI_AVAILABLE = False


class PyGIMLiModellingRunner:
    """Run ERT inversion using pyGIMLi."""

    def run(
        self,
        file_path: str,
        file_format: str,
        array_type: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Execute the pyGIMLi ERT inversion pipeline.

        Args:
            file_path: Path to the survey data file.
            file_format: format of the data file.
            array_type: Electrode array type.
            params: Optional processing parameters.

        Returns:
            Dict with result_data, model_data, plot_data, and quality metrics.
        """
        params = params or {}

        loader = SurveyDataLoader()
        data = loader.load(file_path, file_format)
        electrode_positions = data["electrode_positions"]
        measurements = data["measurements"]
        rho_a = data["apparent_resistivity"]

        if not PYGIMLI_AVAILABLE:
            return self._run_demo(electrode_positions, measurements, rho_a, array_type, params)

        return self._run_ert_inversion(electrode_positions, measurements, rho_a, array_type, params)

    def _run_ert_inversion(
        self,
        electrode_positions: np.ndarray,
        measurements: np.ndarray,
        rho_a: np.ndarray,
        array_type: str,
        params: dict[str, Any],
    ) -> dict[str, Any]:
        """Run actual pyGIMLi ERT inversion."""
        start = time.time()

        max_iterations = params.get("max_iterations", 20)
        lam = params.get("lambda", 20)

        # Create pyGIMLi data container
        n_elec = len(electrode_positions)
        scheme = pg.DataContainerERT()

        # Add electrodes
        for i, pos in enumerate(electrode_positions):
            scheme.createSensor(pg.Pos(float(pos[0]), float(pos[2] if len(pos) > 2 else 0)))

        # Add data entries
        for m in measurements:
            a_idx, b_idx, m_idx, n_idx = int(m[0]), int(m[1]), int(m[2]), int(m[3])
            scheme.createFourPointData(a_idx, b_idx, m_idx, n_idx)

        scheme.set("rhoa", rho_a)
        scheme.set("err", pg.Vector(len(rho_a), 0.03))  # 3% error

        # Run ERT inversion
        mgr = ert.ERTManager(scheme)
        model = mgr.invert(lam=lam, maxIter=max_iterations, verbose=False)

        elapsed = time.time() - start

        mesh = mgr.paraDomain
        cell_centers = np.array([[c.center().x(), c.center().y()] for c in mesh.cells()])

        # Generate visualization
        viz = VisualizationDataGenerator()
        plot_data = viz.generate_resistivity_section(
            cell_centers[:, 0], cell_centers[:, 1], np.array(model)
        )
        plot_data["pseudosection"] = viz.generate_pseudosection(
            electrode_positions, measurements, rho_a
        )

        return {
            "result_data": {
                "resistivity_model": np.array(model).tolist(),
                "cell_centers_x": cell_centers[:, 0].tolist(),
                "cell_centers_z": cell_centers[:, 1].tolist(),
            },
            "model_data": {
                "n_cells": mesh.cellCount(),
                "mesh_type": "Unstructured",
                "lambda": lam,
            },
            "rms_misfit": float(mgr.inv.chi2()) if hasattr(mgr, 'inv') else None,
            "chi_squared": float(mgr.inv.chi2()) if hasattr(mgr, 'inv') else None,
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
        """Generate synthetic demo results when pyGIMLi is not available."""
        x_elec = electrode_positions[:, 0] if electrode_positions.size > 0 else np.linspace(0, 100, 25)
        survey_length = x_elec.max() - x_elec.min() if x_elec.size > 1 else 100

        # Synthetic unstructured-style result
        nx, nz = 50, 25
        x = np.linspace(x_elec.min() - 5, x_elec.max() + 5, nx)
        z = np.linspace(-survey_length / 3, 0, nz)
        X, Z = np.meshgrid(x, z)

        # Synthetic resistivity model — gradient with resistive body
        rho = 80 + 40 * np.abs(Z / Z.min())
        # Resistive anomaly
        r = np.sqrt((X - survey_length * 0.6) ** 2 + (Z + survey_length * 0.15) ** 2)
        rho[r < survey_length * 0.08] = 500.0
        # Conductive layer
        rho[(Z < -survey_length * 0.2) & (Z > -survey_length * 0.25)] = 15.0

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
                "n_cells": nx * nz,
                "mesh_type": "RegularGrid",
                "note": "pyGIMLi not available — demo data generated",
            },
            "rms_misfit": 1.15,
            "chi_squared": 0.98,
            "iterations": 12,
            "output_files": {},
            "plot_data": plot_data,
        }
