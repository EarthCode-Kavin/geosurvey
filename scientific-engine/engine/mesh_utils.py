"""
GeoSurvey Scientific Engine — Mesh Utilities
Mesh generation for SimPEG (tensor) and pyGIMLi (unstructured) workflows.
"""

import numpy as np
from typing import Any


class MeshGenerator:
    """Generate meshes for geophysical inversion and modelling."""

    @staticmethod
    def create_tensor_mesh_2d(
        survey_length: float,
        max_depth: float | None = None,
        core_cell_size: float | None = None,
        n_pad: int = 5,
        pad_factor: float = 1.3,
    ) -> dict[str, Any]:
        """
        Create a 2D tensor mesh definition suitable for SimPEG DC resistivity.

        Args:
            survey_length: Total survey line length in metres.
            max_depth: Maximum depth of interest (default: survey_length / 3).
            core_cell_size: Size of core cells (default: survey_length / 40).
            n_pad: Number of padding cells on each side.
            pad_factor: Geometric expansion factor for padding cells.

        Returns:
            Dict with mesh parameters compatible with SimPEG.
        """
        if max_depth is None:
            max_depth = survey_length / 3.0
        if core_cell_size is None:
            core_cell_size = survey_length / 40.0

        # Core cells
        n_core_x = int(np.ceil(survey_length / core_cell_size)) + 4
        n_core_z = int(np.ceil(max_depth / core_cell_size))

        # Horizontal cell widths
        core_x = np.ones(n_core_x) * core_cell_size
        pad_x = core_cell_size * pad_factor ** np.arange(1, n_pad + 1)
        hx = np.concatenate([pad_x[::-1], core_x, pad_x])

        # Vertical cell widths (downward)
        core_z = np.ones(n_core_z) * core_cell_size
        pad_z = core_cell_size * pad_factor ** np.arange(1, n_pad + 1)
        hz = np.concatenate([pad_z[::-1], core_z])

        # Origin — place origin so survey starts at x = 2 * core_cell_size
        x0 = -np.sum(pad_x) - 2.0 * core_cell_size
        z0 = -np.sum(hz)

        return {
            "hx": hx.tolist(),
            "hz": hz.tolist(),
            "origin": [x0, z0],
            "n_cells": [len(hx), len(hz)],
            "core_cell_size": core_cell_size,
            "survey_length": survey_length,
            "max_depth": max_depth,
        }

    @staticmethod
    def create_unstructured_mesh_2d(
        electrode_positions: np.ndarray,
        max_depth: float | None = None,
        quality: float = 33.5,
        max_area: float | None = None,
    ) -> dict[str, Any]:
        """
        Create an unstructured triangular mesh definition for pyGIMLi.

        Args:
            electrode_positions: (N, 3) electrode xyz positions.
            max_depth: Maximum mesh depth.
            quality: Mesh quality factor (min angle constraint).
            max_area: Maximum triangle area.

        Returns:
            Dict with mesh parameters for pyGIMLi.
        """
        x_elec = electrode_positions[:, 0]
        x_min, x_max = x_elec.min(), x_elec.max()
        survey_length = x_max - x_min

        if max_depth is None:
            max_depth = survey_length / 3.0
        if max_area is None:
            max_area = (survey_length / 20.0) ** 2

        # Boundary polygon
        x_pad = survey_length * 0.3
        boundary = [
            [x_min - x_pad, 0],
            [x_max + x_pad, 0],
            [x_max + x_pad, -max_depth],
            [x_min - x_pad, -max_depth],
        ]

        return {
            "electrode_x": x_elec.tolist(),
            "boundary": boundary,
            "quality": quality,
            "max_area": max_area,
            "max_depth": max_depth,
            "n_electrodes": len(x_elec),
        }

    @staticmethod
    def model_to_grid(
        cell_centers_x: np.ndarray,
        cell_centers_z: np.ndarray,
        model_values: np.ndarray,
        nx: int = 100,
        nz: int = 50,
    ) -> dict[str, list]:
        """
        Interpolate model values onto a regular grid for plotting.

        Args:
            cell_centers_x: X coordinates of cell centres.
            cell_centers_z: Z coordinates of cell centres.
            model_values: Resistivity/property values at cell centres.
            nx, nz: Grid resolution.

        Returns:
            Dict with x, z, values arrays suitable for Plotly contour.
        """
        from scipy.interpolate import griddata

        x_grid = np.linspace(cell_centers_x.min(), cell_centers_x.max(), nx)
        z_grid = np.linspace(cell_centers_z.min(), cell_centers_z.max(), nz)
        X, Z = np.meshgrid(x_grid, z_grid)

        points = np.column_stack([cell_centers_x, cell_centers_z])
        grid_values = griddata(points, model_values, (X, Z), method="cubic")
        grid_values = np.nan_to_num(grid_values, nan=float(np.median(model_values)))

        return {
            "x": x_grid.tolist(),
            "z": z_grid.tolist(),
            "values": grid_values.tolist(),
        }

    @staticmethod
    def mesh_to_threejs(
        vertices: np.ndarray,
        faces: np.ndarray,
        values: np.ndarray,
    ) -> dict[str, list]:
        """
        Convert mesh data to Three.js-compatible format.

        Args:
            vertices: (N, 3) vertex positions.
            faces: (M, 3) triangle indices.
            values: (N,) or (M,) scalar values for colouring.

        Returns:
            Dict with positions, indices, and colours arrays.
        """
        positions = vertices.flatten().tolist()
        indices = faces.flatten().tolist()

        # Normalise values to 0–1 for colour mapping
        v_min, v_max = values.min(), values.max()
        if v_max - v_min < 1e-12:
            normalised = np.zeros_like(values)
        else:
            normalised = (values - v_min) / (v_max - v_min)

        # Generate a simple viridis-like colour map
        colours = []
        for v in normalised:
            r = max(0, min(1, 0.267 + 2.0 * v - 2.5 * v**2))
            g = max(0, min(1, -0.004 + 1.6 * v - 0.7 * v**2))
            b = max(0, min(1, 0.329 + 1.4 * v - 1.8 * v**2 + 0.5 * v**3))
            colours.extend([r, g, b])

        return {
            "positions": positions,
            "indices": indices,
            "colors": colours,
            "value_range": [float(v_min), float(v_max)],
        }
