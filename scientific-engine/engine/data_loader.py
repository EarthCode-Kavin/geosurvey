"""
GeoSurvey Scientific Engine — Unified Data Loader
Loads survey data files into standardised NumPy arrays.
"""

import csv
import re
from pathlib import Path
from typing import Any

import numpy as np


class SurveyDataLoader:
    """
    Load survey data from various file formats into standardised arrays.

    Returns a dict with:
        - electrode_positions: np.ndarray (N, 3) — x, y, z
        - measurements: np.ndarray (M, 5) — a_idx, b_idx, m_idx, n_idx, value
        - apparent_resistivity: np.ndarray (M,)
        - metadata: dict
    """

    SUPPORTED = {"csv", "txt", "res2dinv", "ohm"}

    def load(self, file_path: str, file_format: str) -> dict[str, Any]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        fmt = file_format.lower()
        if fmt == "csv":
            return self._load_csv(path)
        elif fmt == "txt":
            return self._load_txt(path)
        elif fmt == "res2dinv":
            return self._load_res2dinv(path)
        elif fmt == "ohm":
            return self._load_ohm(path)
        else:
            raise ValueError(f"Unsupported format: {file_format}")

    def _load_csv(self, path: Path) -> dict[str, Any]:
        positions = []
        values = []
        electrode_set: set[float] = set()

        with open(path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                row = {k.strip().lower(): v.strip() for k, v in row.items()}
                try:
                    a = float(row.get("a_x", row.get("a", 0)))
                    b = float(row.get("b_x", row.get("b", 0)))
                    m = float(row.get("m_x", row.get("m", 0)))
                    n = float(row.get("n_x", row.get("n", 0)))
                    val = float(row.get("value", row.get("apparent_resistivity", row.get("rho_a", 0))))
                    positions.append([a, b, m, n])
                    values.append(val)
                    electrode_set.update([a, b, m, n])
                except (ValueError, KeyError):
                    continue

        sorted_elec = sorted(electrode_set)
        elec_map = {x: i for i, x in enumerate(sorted_elec)}
        electrode_positions = np.array([[x, 0, 0] for x in sorted_elec])
        measurements = np.array([
            [elec_map[p[0]], elec_map[p[1]], elec_map[p[2]], elec_map[p[3]], v]
            for p, v in zip(positions, values)
        ])

        return {
            "electrode_positions": electrode_positions,
            "measurements": measurements,
            "apparent_resistivity": np.array(values),
            "metadata": {"format": "csv", "num_electrodes": len(sorted_elec)},
        }

    def _load_txt(self, path: Path) -> dict[str, Any]:
        positions = []
        values = []
        electrode_set: set[float] = set()

        with open(path, "r", encoding="utf-8-sig") as f:
            for line in f:
                stripped = line.strip()
                if not stripped or stripped.startswith(("#", "//")):
                    continue
                parts = re.split(r"[,\s\t]+", stripped)
                nums = []
                for p in parts:
                    try:
                        nums.append(float(p))
                    except ValueError:
                        break
                if len(nums) >= 5:
                    positions.append(nums[:4])
                    values.append(nums[4])
                    electrode_set.update(nums[:4])

        sorted_elec = sorted(electrode_set)
        elec_map = {x: i for i, x in enumerate(sorted_elec)}
        electrode_positions = np.array([[x, 0, 0] for x in sorted_elec])
        measurements = np.array([
            [elec_map[p[0]], elec_map[p[1]], elec_map[p[2]], elec_map[p[3]], v]
            for p, v in zip(positions, values)
        ]) if positions else np.empty((0, 5))

        return {
            "electrode_positions": electrode_positions,
            "measurements": measurements,
            "apparent_resistivity": np.array(values),
            "metadata": {"format": "txt", "num_electrodes": len(sorted_elec)},
        }

    def _load_res2dinv(self, path: Path) -> dict[str, Any]:
        with open(path, "r", encoding="utf-8-sig") as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]

        if len(lines) < 6:
            raise ValueError("RES2DINV file too short")

        title = lines[0]
        electrode_spacing = float(lines[1])
        array_code = int(lines[2])
        num_points = int(lines[3])

        array_map = {1: "wenner", 3: "dipole_dipole", 7: "schlumberger"}

        electrode_set: set[float] = set()
        raw_positions = []
        values = []

        for i in range(5, min(5 + num_points, len(lines))):
            parts = lines[i].split()
            if len(parts) >= 3:
                x_mid = float(parts[0])
                a = float(parts[1])
                rho_a = float(parts[2])
                if array_code == 1:  # Wenner
                    a1, a2, a3, a4 = x_mid - 1.5 * a, x_mid - 0.5 * a, x_mid + 0.5 * a, x_mid + 1.5 * a
                else:
                    a1, a2, a3, a4 = x_mid - a, x_mid - a / 3, x_mid + a / 3, x_mid + a
                raw_positions.append([a1, a4, a2, a3])
                values.append(rho_a)
                electrode_set.update([a1, a2, a3, a4])

        sorted_elec = sorted(electrode_set)
        elec_map = {x: i for i, x in enumerate(sorted_elec)}
        electrode_positions = np.array([[x, 0, 0] for x in sorted_elec])
        measurements = np.array([
            [elec_map[p[0]], elec_map[p[1]], elec_map[p[2]], elec_map[p[3]], v]
            for p, v in zip(raw_positions, values)
        ]) if raw_positions else np.empty((0, 5))

        return {
            "electrode_positions": electrode_positions,
            "measurements": measurements,
            "apparent_resistivity": np.array(values),
            "metadata": {
                "format": "res2dinv",
                "title": title,
                "electrode_spacing": electrode_spacing,
                "array_type": array_map.get(array_code, "unknown"),
                "num_electrodes": len(sorted_elec),
            },
        }

    def _load_ohm(self, path: Path) -> dict[str, Any]:
        with open(path, "r", encoding="utf-8-sig") as f:
            lines = [l.strip() for l in f.readlines()]

        electrode_positions = []
        raw_measurements = []
        section = None
        num_electrodes = 0
        i = 0

        while i < len(lines):
            line = lines[i]
            if line.startswith("#"):
                i += 1
                continue

            if num_electrodes == 0 and re.match(r"^\d+$", line):
                num_electrodes = int(line)
                section = "electrodes"
                i += 1
                if i < len(lines) and lines[i].startswith("#"):
                    i += 1
                continue

            if section == "electrodes" and len(electrode_positions) < num_electrodes:
                parts = line.split()
                if len(parts) >= 1:
                    x = float(parts[0])
                    z = float(parts[1]) if len(parts) > 1 else 0
                    electrode_positions.append([x, 0, z])
                i += 1
                if len(electrode_positions) == num_electrodes:
                    section = "data_header"
                continue

            if section == "data_header" and re.match(r"^\d+$", line):
                section = "data"
                i += 1
                if i < len(lines) and lines[i].startswith("#"):
                    i += 1
                continue

            if section == "data":
                parts = line.split()
                if len(parts) >= 5:
                    try:
                        a_i, b_i, m_i, n_i = int(parts[0]) - 1, int(parts[1]) - 1, int(parts[2]) - 1, int(parts[3]) - 1
                        val = float(parts[4])
                        raw_measurements.append([a_i, b_i, m_i, n_i, val])
                    except (ValueError, IndexError):
                        pass
            i += 1

        elec_arr = np.array(electrode_positions) if electrode_positions else np.empty((0, 3))
        meas_arr = np.array(raw_measurements) if raw_measurements else np.empty((0, 5))
        values = meas_arr[:, 4] if meas_arr.size > 0 else np.array([])

        return {
            "electrode_positions": elec_arr,
            "measurements": meas_arr,
            "apparent_resistivity": values,
            "metadata": {"format": "ohm", "num_electrodes": len(electrode_positions)},
        }
