"use client";

import { useMemo } from "react";
import Plot from "react-plotly.js";

interface ResistivityPlotProps {
    data: Record<string, unknown>;
}

export default function ResistivityPlot({ data }: ResistivityPlotProps) {
    const plotlyData = useMemo(() => {
        const section = (data as { plotly_data?: { resistivity_section?: Record<string, unknown> } })
            ?.plotly_data?.resistivity_section
            || (data as { resistivity_section?: Record<string, unknown> })?.resistivity_section;

        if (!section) return null;

        const x = (section as { x?: number[] }).x || [];
        const z = (section as { z?: number[] }).z || [];
        const values = (section as { values?: number[][] }).values || [];

        return {
            traces: [
                {
                    type: "contour" as const,
                    x,
                    y: z,
                    z: values,
                    colorscale: "Jet",
                    contours: { coloring: "heatmap" as const },
                    colorbar: {
                        title: { text: "log₁₀(ρ) [Ω·m]", font: { color: "#e2e8f0", size: 12 } },
                        tickfont: { color: "#94a3b8" },
                    },
                },
            ],
            layout: {
                paper_bgcolor: "transparent",
                plot_bgcolor: "#1a2035",
                font: { color: "#e2e8f0" },
                xaxis: { title: "Distance (m)", gridcolor: "#2d3a5c" },
                yaxis: { title: "Depth (m)", autorange: "reversed" as const, gridcolor: "#2d3a5c" },
                margin: { l: 60, r: 20, t: 30, b: 50 },
                height: 350,
            },
        };
    }, [data]);

    if (!plotlyData) {
        return (
            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                No resistivity data to display.
            </div>
        );
    }

    return (
        <Plot
            data={plotlyData.traces}
            layout={plotlyData.layout}
            config={{ responsive: true, displayModeBar: true, displaylogo: false }}
            style={{ width: "100%", height: 350 }}
        />
    );
}
