"""
GeoSurvey Scientific Engine — Apparent Resistivity Calculations
Computes geometric factors and apparent resistivity for common electrode arrays.
"""

import numpy as np
from typing import Literal


ArrayType = Literal["wenner", "schlumberger", "dipole_dipole"]


class ApparentResistivity:
    """Calculate apparent resistivity for various electrode configurations."""

    @staticmethod
    def geometric_factor(
        a: np.ndarray,
        b: np.ndarray,
        m: np.ndarray,
        n: np.ndarray,
    ) -> np.ndarray:
        """
        Compute the geometric factor K for a general four-electrode configuration.

        K = 2π / (1/AM − 1/BM − 1/AN + 1/BN)

        Args:
            a, b, m, n: Electrode positions as (N, 3) or scalar x-positions.
        """
        a, b, m, n = [np.atleast_2d(x) if x.ndim == 1 and x.shape[0] == 3 else np.atleast_2d(x) for x in [a, b, m, n]]

        def dist(p1, p2):
            return np.sqrt(np.sum((p1 - p2) ** 2, axis=-1))

        am = dist(a, m)
        bm = dist(b, m)
        an = dist(a, n)
        bn = dist(b, n)

        # Avoid division by zero
        eps = 1e-12
        am = np.maximum(am, eps)
        bm = np.maximum(bm, eps)
        an = np.maximum(an, eps)
        bn = np.maximum(bn, eps)

        denom = 1.0 / am - 1.0 / bm - 1.0 / an + 1.0 / bn
        denom = np.where(np.abs(denom) < eps, eps, denom)

        return 2.0 * np.pi / denom

    @staticmethod
    def wenner_k(a_spacing: float) -> float:
        """Geometric factor for Wenner array: K = 2πa."""
        return 2.0 * np.pi * a_spacing

    @staticmethod
    def schlumberger_k(ab_half: float, mn_half: float) -> float:
        """
        Geometric factor for Schlumberger array.
        K = π(AB/2)² / MN  (when MN << AB)
        """
        mn = 2.0 * mn_half
        if mn < 1e-12:
            return float("inf")
        return np.pi * ab_half**2 / mn

    @staticmethod
    def dipole_dipole_k(a_spacing: float, n_factor: int) -> float:
        """
        Geometric factor for Dipole-Dipole array.
        K = πa·n(n+1)(n+2)
        """
        return np.pi * a_spacing * n_factor * (n_factor + 1) * (n_factor + 2)

    @classmethod
    def compute(
        cls,
        electrode_positions: np.ndarray,
        measurements: np.ndarray,
        array_type: ArrayType | None = None,
    ) -> np.ndarray:
        """
        Compute apparent resistivity for all measurements.

        Args:
            electrode_positions: (N, 3) array of electrode x, y, z.
            measurements: (M, 5) array where columns are [a_idx, b_idx, m_idx, n_idx, value].
                          'value' may be resistance (Ohm) or already apparent resistivity.
            array_type: Optional hint; if None, uses general geometric factor.

        Returns:
            (M,) array of apparent resistivity values.
        """
        if measurements.size == 0:
            return np.array([])

        a_idx = measurements[:, 0].astype(int)
        b_idx = measurements[:, 1].astype(int)
        m_idx = measurements[:, 2].astype(int)
        n_idx = measurements[:, 3].astype(int)
        values = measurements[:, 4]

        a_pos = electrode_positions[a_idx]
        b_pos = electrode_positions[b_idx]
        m_pos = electrode_positions[m_idx]
        n_pos = electrode_positions[n_idx]

        k = cls.geometric_factor(a_pos, b_pos, m_pos, n_pos)

        # If values look like they're already apparent resistivity (> 1 Ω·m typically),
        # return them as-is. Otherwise multiply by K.
        median_val = np.median(np.abs(values)) if len(values) > 0 else 0
        if median_val > 0.1:
            return values  # Already apparent resistivity
        return k * values

    @staticmethod
    def pseudosection_positions(
        electrode_positions: np.ndarray,
        measurements: np.ndarray,
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        Compute pseudosection x, z (depth) positions for plotting.

        Returns:
            x_pseudo: (M,) midpoint x positions
            z_pseudo: (M,) pseudo-depth values
        """
        if measurements.size == 0:
            return np.array([]), np.array([])

        a_idx = measurements[:, 0].astype(int)
        n_idx = measurements[:, 3].astype(int)

        a_x = electrode_positions[a_idx, 0]
        n_x = electrode_positions[n_idx, 0]

        x_pseudo = (a_x + n_x) / 2.0
        z_pseudo = -np.abs(n_x - a_x) / 2.0  # negative = downward

        return x_pseudo, z_pseudo
