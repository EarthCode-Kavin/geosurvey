"""
GeoSurvey Scientific Engine — Visualization Data Generator
Converts processing results to Plotly and Three.js compatible JSON.
"""

import numpy as np
from typing import Any


class VisualizationDataGenerator:
    """Generate JSON-serializable visualization data for the frontend."""

    def generate_resistivity_section(
        self,
        x: np.ndarray,
        z: np.ndarray,
        resistivity: np.ndarray,
        nx: int = 100,
        nz: int = 50,
    ) -> dict[str, Any]:
        """
        Generate a Plotly-compatible 2D resistivity section (contour heatmap).

        Args:
            x: X coordinates of model cells.
            z: Z (depth) coordinates of model cells.
            resistivity: Resistivity values.
            nx, nz: Interpolation grid resolution.

        Returns:
            Dict with 'resistivity_section' key containing Plotly trace data.
        """
        from scipy.interpolate import griddata

        x, z, resistivity = np.asarray(x), np.asarray(z), np.asarray(resistivity)

        x_grid = np.linspace(x.min(), x.max(), nx)
        z_grid = np.linspace(z.min(), z.max(), nz)
        X_grid, Z_grid = np.meshgrid(x_grid, z_grid)

        points = np.column_stack([x, z])
        log_rho = np.log10(np.maximum(resistivity, 1e-6))
        grid_values = griddata(points, log_rho, (X_grid, Z_grid), method="cubic")
        grid_values = np.nan_to_num(grid_values, nan=float(np.median(log_rho)))

        return {
            "resistivity_section": {
                "type": "contour",
                "x": x_grid.tolist(),
                "z": z_grid.tolist(),
                "values": grid_values.tolist(),
                "colorscale": "Jet",
                "colorbar_title": "log₁₀(ρ) [Ω·m]",
                "layout": {
                    "title": "Resistivity Section",
                    "xaxis": {"title": "Distance (m)"},
                    "yaxis": {"title": "Depth (m)", "autorange": "reversed"},
                },
            },
        }

    def generate_pseudosection(
        self,
        electrode_positions: np.ndarray,
        measurements: np.ndarray,
        apparent_resistivity: np.ndarray,
    ) -> dict[str, Any]:
        """
        Generate pseudosection scatter data for Plotly.

        Args:
            electrode_positions: Electrode xyz positions.
            measurements: Measurement array with indices.
            apparent_resistivity: Measured apparent resistivity values.

        Returns:
            Dict with Plotly scatter trace data.
        """
        if measurements.size == 0:
            return {"type": "scatter", "x": [], "z": [], "values": []}

        a_idx = measurements[:, 0].astype(int)
        n_idx = measurements[:, 3].astype(int)

        a_x = electrode_positions[a_idx, 0]
        n_x = electrode_positions[n_idx, 0]

        x_pseudo = (a_x + n_x) / 2.0
        z_pseudo = -np.abs(n_x - a_x) / 2.0  # pseudo-depth

        return {
            "type": "scatter",
            "x": x_pseudo.tolist(),
            "z": z_pseudo.tolist(),
            "values": apparent_resistivity.tolist(),
            "log_values": np.log10(np.maximum(apparent_resistivity, 1e-6)).tolist(),
            "colorscale": "Jet",
            "colorbar_title": "Apparent Resistivity (Ω·m)",
            "layout": {
                "title": "Apparent Resistivity Pseudosection",
                "xaxis": {"title": "Distance (m)"},
                "yaxis": {"title": "Pseudo-depth (m)"},
            },
        }

    def generate_mesh_3d(
        self,
        x: np.ndarray,
        z: np.ndarray,
        resistivity: np.ndarray,
        y_extent: float = 20.0,
        ny: int = 5,
    ) -> dict[str, Any]:
        """
        Generate Three.js-compatible 3D mesh data by extruding a 2D section.

        Args:
            x: X coordinates.
            z: Z (depth) coordinates.
            resistivity: Resistivity values.
            y_extent: Y-axis extent for 3D extrusion.
            ny: Number of Y slices.

        Returns:
            Dict with 'mesh_3d' key containing Three.js data.
        """
        from scipy.interpolate import griddata

        x, z, resistivity = np.asarray(x), np.asarray(z), np.asarray(resistivity)

        # Create 2D grid first
        nx_g, nz_g = 30, 15
        x_grid = np.linspace(x.min(), x.max(), nx_g)
        z_grid = np.linspace(z.min(), z.max(), nz_g)
        y_grid = np.linspace(0, y_extent, ny)

        X2, Z2 = np.meshgrid(x_grid, z_grid)
        points = np.column_stack([x, z])
        log_rho = np.log10(np.maximum(resistivity, 1e-6))
        grid_2d = griddata(points, log_rho, (X2, Z2), method="linear")
        grid_2d = np.nan_to_num(grid_2d, nan=float(np.median(log_rho)))

        # Extrude to 3D
        vertices = []
        values = []
        for iy, y_val in enumerate(y_grid):
            for iz in range(nz_g):
                for ix in range(nx_g):
                    vertices.append([x_grid[ix], y_val, z_grid[iz]])
                    values.append(grid_2d[iz, ix])

        # Generate triangular faces for surface mesh
        faces = []
        for iy in range(ny - 1):
            for iz in range(nz_g - 1):
                for ix in range(nx_g - 1):
                    idx = lambda iy_, iz_, ix_: iy_ * nz_g * nx_g + iz_ * nx_g + ix_  # noqa: E731
                    # Two triangles per quad
                    v0 = idx(iy, iz, ix)
                    v1 = idx(iy, iz, ix + 1)
                    v2 = idx(iy + 1, iz, ix)
                    v3 = idx(iy + 1, iz, ix + 1)
                    faces.append([v0, v1, v2])
                    faces.append([v1, v3, v2])

        # Normalise values for colour mapping
        values_arr = np.array(values)
        v_min, v_max = values_arr.min(), values_arr.max()
        if v_max - v_min < 1e-12:
            norm_values = np.zeros_like(values_arr)
        else:
            norm_values = (values_arr - v_min) / (v_max - v_min)

        # Simple colour map (viridis-like)
        colors = []
        for v in norm_values:
            r = max(0, min(1, 0.267 + 2.0 * v - 2.5 * v ** 2))
            g = max(0, min(1, -0.004 + 1.6 * v - 0.7 * v ** 2))
            b = max(0, min(1, 0.329 + 1.4 * v - 1.8 * v ** 2 + 0.5 * v ** 3))
            colors.extend([r, g, b])

        return {
            "mesh_3d": {
                "positions": [coord for v in vertices for coord in v],
                "indices": [idx for f in faces for idx in f],
                "colors": colors,
                "value_range": [float(v_min), float(v_max)],
                "dimensions": {"nx": nx_g, "ny": ny, "nz": nz_g},
            },
        }

    def generate_borehole_log_data(
        self,
        soil_layers: list[dict],
        spt_values: list[dict],
        total_depth: float,
        groundwater_depth: float | None = None,
    ) -> dict[str, Any]:
        """
        Generate structured data for interactive borehole log visualization.

        Returns:
            Dict with Plotly-compatible bar and scatter trace data.
        """
        # Soil layer column (horizontal bar chart)
        layer_traces = []
        soil_colors = {
            "topsoil": "#8B4513", "clay": "#D2691E", "silt": "#DEB887",
            "sand": "#F4A460", "gravel": "#A0522D", "rock": "#808080",
            "fill": "#696969", "peat": "#2F4F4F",
        }

        for layer in soil_layers:
            depth_from = layer.get("depth_from", 0)
            depth_to = layer.get("depth_to", 0)
            desc = layer.get("description", "Unknown").lower()
            color = layer.get("color", soil_colors.get(desc.split()[0], "#B8860B"))

            layer_traces.append({
                "type": "bar",
                "y": [(depth_from + depth_to) / 2],
                "x": [1],
                "width": [depth_to - depth_from],
                "orientation": "h",
                "marker_color": color,
                "name": layer.get("description", ""),
                "hovertext": f"{layer.get('description', '')} ({layer.get('uscs', '')})",
            })

        # SPT values (scatter plot)
        spt_trace = {
            "type": "scatter",
            "x": [s.get("n_value", 0) for s in spt_values],
            "y": [s.get("depth", 0) for s in spt_values],
            "mode": "lines+markers",
            "name": "SPT N-value",
            "marker_color": "#e53e3e",
        }

        return {
            "soil_layers": layer_traces,
            "spt_values": spt_trace,
            "groundwater_depth": groundwater_depth,
            "total_depth": total_depth,
            "layout": {
                "yaxis": {"title": "Depth (m)", "autorange": "reversed"},
                "xaxis": {"title": "N-value / Width"},
            },
        }
