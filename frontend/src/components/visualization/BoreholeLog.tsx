"use client";

import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { visualizationApi, boreholesApi } from "@/lib/api";
import type { Borehole } from "@/lib/api";

interface BoreholeLogProps {
    projectId: number;
}

export default function BoreholeLog({ projectId }: BoreholeLogProps) {
    const [boreholes, setBoreholes] = useState<Borehole[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [logData, setLogData] = useState<Record<string, unknown> | null>(null);

    useEffect(() => {
        boreholesApi.list(projectId).then(setBoreholes).catch(() => { });
    }, [projectId]);

    useEffect(() => {
        if (selected) {
            visualizationApi.getBoreholeLog(selected).then(setLogData).catch(() => setLogData(null));
        }
    }, [selected]);

    const soilLayers = (logData as { soil_layers?: Array<{ depth_from: number; depth_to: number; description: string }> })?.soil_layers || [];
    const sptValues = (logData as { spt_values?: Array<{ depth: number; n_value: number }> })?.spt_values || [];
    const gwDepth = (logData as { groundwater_depth?: number })?.groundwater_depth;
    const totalDepth = (logData as { total_depth?: number })?.total_depth || 20;

    // Soil colour mapping
    const soilColors: Record<string, string> = {
        topsoil: "#8B4513", clay: "#D2691E", silt: "#DEB887", sand: "#F4A460",
        gravel: "#A0522D", rock: "#808080", fill: "#696969", peat: "#2F4F4F",
    };

    return (
        <div>
            <select
                className="form-input"
                style={{ marginBottom: 16, maxWidth: 300 }}
                value={selected || ""}
                onChange={(e) => setSelected(Number(e.target.value) || null)}
                id="borehole-selector"
            >
                <option value="">Select a borehole...</option>
                {boreholes.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.total_depth}m)</option>
                ))}
            </select>

            {logData ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Soil Column */}
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                            Soil Profile
                        </div>
                        <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden" }}>
                            {soilLayers.map((layer, i) => {
                                const keyword = layer.description?.toLowerCase().split(" ")[0] || "";
                                const color = soilColors[keyword] || "#B8860B";
                                const heightPct = ((layer.depth_to - layer.depth_from) / totalDepth) * 300;
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            height: Math.max(heightPct, 30),
                                            background: color,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "4px 12px",
                                            fontSize: 12,
                                            color: "#fff",
                                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                                        }}
                                    >
                                        <span>{layer.description}</span>
                                        <span style={{ opacity: 0.7 }}>{layer.depth_from}–{layer.depth_to}m</span>
                                    </div>
                                );
                            })}
                            {gwDepth && (
                                <div style={{ padding: 8, fontSize: 12, color: "var(--accent-cyan)", background: "rgba(6, 182, 212, 0.1)" }}>
                                    💧 Groundwater: {gwDepth}m
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SPT Chart */}
                    {sptValues.length > 0 && (
                        <Plot
                            data={[
                                {
                                    type: "scatter",
                                    x: sptValues.map((s) => s.n_value),
                                    y: sptValues.map((s) => s.depth),
                                    mode: "lines+markers" as const,
                                    marker: { color: "#ef4444", size: 8 },
                                    line: { color: "#ef4444", width: 2 },
                                    name: "SPT N-value",
                                },
                            ]}
                            layout={{
                                paper_bgcolor: "transparent",
                                plot_bgcolor: "#1a2035",
                                font: { color: "#e2e8f0", size: 11 },
                                xaxis: { title: "N-value", gridcolor: "#2d3a5c" },
                                yaxis: { title: "Depth (m)", autorange: "reversed", gridcolor: "#2d3a5c" },
                                margin: { l: 50, r: 10, t: 10, b: 40 },
                                height: 300,
                                showlegend: false,
                            }}
                            config={{ responsive: true, displayModeBar: false }}
                            style={{ width: "100%", height: 300 }}
                        />
                    )}
                </div>
            ) : (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                    {boreholes.length > 0 ? "Select a borehole to view its log." : "No boreholes in this project."}
                </div>
            )}
        </div>
    );
}
