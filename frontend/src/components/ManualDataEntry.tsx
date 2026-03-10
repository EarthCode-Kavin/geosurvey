"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { SIMPEG_METHODS, DataColumn } from "../lib/simpegMethods";

interface RowData {
    id: string;
    [key: string]: string;
}

interface ManualDataEntryProps {
    arrayType: string;
    onDataChange: (file: File | null) => void;
}

export default function ManualDataEntry({ arrayType, onDataChange }: ManualDataEntryProps) {
    const onDataChangeRef = useRef(onDataChange);

    const columns = useMemo(() => getColumns(arrayType), [arrayType]);

    const [rows, setRows] = useState<RowData[]>([]);

    useEffect(() => {
        onDataChangeRef.current = onDataChange;
    }, [onDataChange]);

    useEffect(() => {
        // Reset rows when array type changes
        setRows([{ id: Date.now().toString(), ...emptyRow(columns) }]);
    }, [arrayType, columns]);

    useEffect(() => {
        // Only generate file if there's actual data input in at least one cell
        const hasData = rows.some(r => columns.some(c => r[c.key] && r[c.key].trim() !== ""));
        if (!hasData) {
            onDataChangeRef.current(null);
            return;
        }

        // Generate CSV string
        const headerRow = columns.map(c => c.key).join(",");
        const dataRows = rows.map(r => columns.map(c => r[c.key] || "").join(",")).join("\n");
        const csvContent = `${headerRow}\n${dataRows}`;

        // Convert to a File object so the parent can upload it normally
        const file = new File([csvContent], `manual_${arrayType}_data.csv`, { type: "text/csv" });
        onDataChangeRef.current(file);
    }, [rows, arrayType, columns]);

    const handleAddRow = () => {
        setRows([...rows, { id: Date.now().toString() + Math.random(), ...emptyRow(columns) }]);
    };

    const handleRemoveRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const handleChange = (id: string, key: string, value: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, [key]: value } : r));
    };

    return (
        <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ maxHeight: 250, overflowY: "auto" }}>
                <table className="data-table" style={{ margin: 0 }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                            <th style={{ width: 40, borderTop: "none", padding: "8px 12px", textAlign: "center" }}>#</th>
                            {columns.map(c => (
                                <th key={c.key} style={{ padding: "8px 12px", borderTop: "none" }}>{c.label}</th>
                            ))}
                            <th style={{ width: 40, borderTop: "none", padding: "8px 12px" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={row.id}>
                                <td style={{ padding: "4px 12px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
                                    {idx + 1}
                                </td>
                                {columns.map(c => (
                                    <td key={c.key} style={{ padding: "4px 8px" }}>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-input"
                                            style={{ padding: "6px 8px", fontSize: 13 }}
                                            value={row[c.key] || ""}
                                            onChange={(e) => handleChange(row.id, c.key, e.target.value)}
                                            placeholder={`0.0`}
                                        />
                                    </td>
                                ))}
                                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRow(row.id)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "var(--accent-red)",
                                            cursor: rows.length > 1 ? "pointer" : "not-allowed",
                                            opacity: rows.length > 1 ? 1 : 0.3,
                                            fontSize: 14
                                        }}
                                        disabled={rows.length <= 1}
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-color)" }}>
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: "4px 10px", background: "var(--bg-card)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                >
                    + Add Row
                </button>
            </div>
        </div>
    );
}

function emptyRow(columns: DataColumn[]) {
    const row: Record<string, string> = {};
    columns.forEach(c => row[c.key] = "");
    return row;
}

function getColumns(type: string): DataColumn[] {
    const method = SIMPEG_METHODS.find(m => m.id === type);
    return method ? method.columns : [];
}
