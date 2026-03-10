"""
GeoSurvey Platform — Survey File Parser
Parses CSV, TXT, and RES2DINV format survey data files.
"""

import csv
import re
from pathlib import Path
from typing import Any


class SurveyFileParser:
    """Unified parser for geophysical survey data files."""

    SUPPORTED_FORMATS = {"csv", "txt", "res2dinv", "ohm"}

    def parse(self, file_path: str, file_format: str) -> dict[str, Any]:
        """
        Parse a survey data file and return a normalised data dict.

        Returns:
            {
                "format": str,
                "num_data_points": int,
                "electrode_positions": [[x, y, z], ...],
                "measurements": [
                    {"a": [x,y,z], "b": [x,y,z], "m": [x,y,z], "n": [x,y,z], "value": float},
                    ...
                ],
                "metadata": {...},
                "raw_header": str,
            }
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Survey file not found: {file_path}")

        fmt = file_format.lower()
        if fmt == "csv":
            return self._parse_csv(path)
        elif fmt == "txt":
            return self._parse_txt(path)
        elif fmt == "res2dinv":
            return self._parse_res2dinv(path)
        elif fmt == "ohm":
            return self._parse_ohm(path)
        else:
            raise ValueError(f"Unsupported format: {file_format}")

    # ── CSV Parser ──────────────────────────────────────────────────────

    def _parse_csv(self, path: Path) -> dict[str, Any]:
        """Parse a comma-separated survey file."""
        measurements = []
        electrodes = set()

        with open(path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            headers = [h.strip().lower() for h in (reader.fieldnames or [])]

            for row in reader:
                row = {k.strip().lower(): v.strip() for k, v in row.items()}
                try:
                    # Expect columns: a_x, b_x, m_x, n_x, value (or apparent_resistivity)
                    a_x = float(row.get("a_x", row.get("a", 0)))
                    b_x = float(row.get("b_x", row.get("b", 0)))
                    m_x = float(row.get("m_x", row.get("m", 0)))
                    n_x = float(row.get("n_x", row.get("n", 0)))
                    value = float(
                        row.get("value", row.get("apparent_resistivity", row.get("rho_a", 0)))
                    )
                    measurements.append({
                        "a": [a_x, 0, 0],
                        "b": [b_x, 0, 0],
                        "m": [m_x, 0, 0],
                        "n": [n_x, 0, 0],
                        "value": value,
                    })
                    electrodes.update([a_x, b_x, m_x, n_x])
                except (ValueError, KeyError):
                    continue

        electrode_positions = [[x, 0, 0] for x in sorted(electrodes)]

        return {
            "format": "csv",
            "num_data_points": len(measurements),
            "electrode_positions": electrode_positions,
            "measurements": measurements,
            "metadata": {"headers": headers},
            "raw_header": "",
        }

    # ── Plain TXT Parser ────────────────────────────────────────────────

    def _parse_txt(self, path: Path) -> dict[str, Any]:
        """Parse a whitespace-delimited text file."""
        measurements = []
        electrodes = set()
        header_lines = []

        with open(path, "r", encoding="utf-8-sig") as f:
            lines = f.readlines()

        data_started = False
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or stripped.startswith("//"):
                header_lines.append(stripped)
                continue

            parts = re.split(r"[,\s\t]+", stripped)
            nums = []
            for p in parts:
                try:
                    nums.append(float(p))
                except ValueError:
                    break

            if len(nums) >= 5:
                data_started = True
                a_x, b_x, m_x, n_x = nums[0], nums[1], nums[2], nums[3]
                value = nums[4]
                measurements.append({
                    "a": [a_x, 0, 0],
                    "b": [b_x, 0, 0],
                    "m": [m_x, 0, 0],
                    "n": [n_x, 0, 0],
                    "value": value,
                })
                electrodes.update([a_x, b_x, m_x, n_x])
            elif not data_started:
                header_lines.append(stripped)

        electrode_positions = [[x, 0, 0] for x in sorted(electrodes)]

        return {
            "format": "txt",
            "num_data_points": len(measurements),
            "electrode_positions": electrode_positions,
            "measurements": measurements,
            "metadata": {},
            "raw_header": "\n".join(header_lines),
        }

    # ── RES2DINV .dat Parser ────────────────────────────────────────────

    def _parse_res2dinv(self, path: Path) -> dict[str, Any]:
        """
        Parse RES2DINV format.
        Line 1: title
        Line 2: electrode spacing
        Line 3: array type code (1=Wenner, 2=Pole-Pole, 3=Dipole-Dipole,
                 6=Pole-Dipole, 7=Schlumberger)
        Line 4: number of data points
        Line 5: 0 (flag)
        Remaining: data lines (x_midpoint, spacing, apparent_resistivity)
        """
        with open(path, "r", encoding="utf-8-sig") as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]

        if len(lines) < 6:
            raise ValueError("RES2DINV file too short")

        title = lines[0]
        electrode_spacing = float(lines[1])
        array_code = int(lines[2])
        num_points = int(lines[3])

        array_map = {1: "wenner", 3: "dipole_dipole", 7: "schlumberger"}
        array_type = array_map.get(array_code, "unknown")

        measurements = []
        electrodes = set()

        for i in range(5, min(5 + num_points, len(lines))):
            parts = lines[i].split()
            if len(parts) >= 3:
                x_mid = float(parts[0])
                a = float(parts[1])  # electrode spacing / datum
                rho_a = float(parts[2])

                # Reconstruct electrode positions from midpoint and spacing
                if array_type == "wenner":
                    a1 = x_mid - 1.5 * a
                    a2 = x_mid - 0.5 * a
                    a3 = x_mid + 0.5 * a
                    a4 = x_mid + 1.5 * a
                else:
                    a1 = x_mid - a
                    a2 = x_mid - a / 3
                    a3 = x_mid + a / 3
                    a4 = x_mid + a

                measurements.append({
                    "a": [a1, 0, 0],
                    "b": [a4, 0, 0],
                    "m": [a2, 0, 0],
                    "n": [a3, 0, 0],
                    "value": rho_a,
                })
                electrodes.update([a1, a2, a3, a4])

        electrode_positions = [[x, 0, 0] for x in sorted(electrodes)]

        return {
            "format": "res2dinv",
            "num_data_points": len(measurements),
            "electrode_positions": electrode_positions,
            "measurements": measurements,
            "metadata": {
                "title": title,
                "electrode_spacing": electrode_spacing,
                "array_type": array_type,
                "array_code": array_code,
            },
            "raw_header": title,
        }

    # ── OHM (Unified Data Format) Parser ────────────────────────────────

    def _parse_ohm(self, path: Path) -> dict[str, Any]:
        """Parse .ohm format (pyGIMLi compatible)."""
        with open(path, "r", encoding="utf-8-sig") as f:
            lines = [l.strip() for l in f.readlines()]

        electrode_positions = []
        measurements = []
        section = None

        i = 0
        num_electrodes = 0
        num_data = 0

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
                    i += 1  # skip header
                continue

            if section == "electrodes" and len(electrode_positions) < num_electrodes:
                parts = line.split()
                if len(parts) >= 2:
                    x = float(parts[0])
                    z = float(parts[1]) if len(parts) > 1 else 0
                    electrode_positions.append([x, 0, z])
                i += 1
                if len(electrode_positions) == num_electrodes:
                    section = "data_header"
                continue

            if section == "data_header":
                if re.match(r"^\d+$", line):
                    num_data = int(line)
                    section = "data"
                    i += 1
                    if i < len(lines) and lines[i].startswith("#"):
                        i += 1  # skip header
                    continue

            if section == "data":
                parts = line.split()
                if len(parts) >= 5:
                    try:
                        a_idx = int(parts[0]) - 1
                        b_idx = int(parts[1]) - 1
                        m_idx = int(parts[2]) - 1
                        n_idx = int(parts[3]) - 1
                        value = float(parts[4])
                        measurements.append({
                            "a": electrode_positions[a_idx] if a_idx < len(electrode_positions) else [0, 0, 0],
                            "b": electrode_positions[b_idx] if b_idx < len(electrode_positions) else [0, 0, 0],
                            "m": electrode_positions[m_idx] if m_idx < len(electrode_positions) else [0, 0, 0],
                            "n": electrode_positions[n_idx] if n_idx < len(electrode_positions) else [0, 0, 0],
                            "value": value,
                        })
                    except (IndexError, ValueError):
                        pass

            i += 1

        return {
            "format": "ohm",
            "num_data_points": len(measurements),
            "electrode_positions": electrode_positions,
            "measurements": measurements,
            "metadata": {},
            "raw_header": "",
        }
