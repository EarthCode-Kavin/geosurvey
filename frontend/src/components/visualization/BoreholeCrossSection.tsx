"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { calculateCumulativeDistances } from "@/lib/geo";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div>Loading Cross Section...</div> });

interface SoilLayer {
    depth_from: number;
    depth_to: number;
    description: string;
    uscs?: string | null;
}

interface Borehole {
    id: number;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    elevation?: number | null;
    total_depth: number;
    groundwater_depth?: number | null;
    soil_layers?: SoilLayer[];
}

interface BoreholeCrossSectionProps {
    boreholes: Borehole[];
}

// Map USCS codes roughly to colors
const getColorForUSCS = (uscs?: string | null) => {
    if (!uscs) return "#cccccc";
    const type = uscs.toUpperCase();
    if (type.includes("CL") || type.includes("CH")) return "#e5c07b"; // Clay
    if (type.includes("ML") || type.includes("MH")) return "#d19a66"; // Silt
    if (type.includes("SW") || type.includes("SP") || type.includes("SM") || type.includes("SC")) return "#e5c07b"; // Sand
    if (type.includes("GW") || type.includes("GP") || type.includes("GM") || type.includes("GC")) return "#98c379"; // Gravel
    if (type.includes("PT") || type.includes("OH") || type.includes("OL")) return "#56b6c2"; // Peat/Organic
    return "#cccccc"; // Default
};

export default function BoreholeCrossSection({ boreholes }: BoreholeCrossSectionProps) {
    const plotData = useMemo(() => {
        // Filter out boreholes missing essential coordinates or elevation for cross-section
        const validBoreholes = boreholes.filter(
            (bh) => bh.latitude != null && bh.longitude != null && bh.elevation != null
        );

        if (validBoreholes.length === 0) return null;

        // Sort by longitude (west to east) to create a meaningful cross-section line
        validBoreholes.sort((a, b) => (a.longitude!) - (b.longitude!));

        const coords = validBoreholes.map((bh) => ({ id: bh.id, lat: bh.latitude!, lon: bh.longitude! }));
        const distances = calculateCumulativeDistances(coords);

        const shapes: any[] = [];
        const labels: any[] = [];

        let minElev = Infinity;
        let maxElev = -Infinity;

        validBoreholes.forEach((bh) => {
            const x = distances[bh.id];
            const topElev = bh.elevation!;
            const bottomElev = topElev - bh.total_depth;

            // Track min/max for chart axes
            if (bottomElev < minElev) minElev = bottomElev;
            if (topElev > maxElev) maxElev = topElev;

            const width = 10; // Fixed visual width of the borehole log in the plot

            // Add borehole name label above the top
            labels.push({
                x: x,
                y: topElev + 2, // Slightly above the top
                text: bh.name,
                mode: "text",
                textposition: "top center",
                type: "scatter",
                hoverinfo: "none",
                showlegend: false,
            });

            // Draw groundwater level if available
            if (bh.groundwater_depth != null) {
                labels.push({
                    x: x + width / 2 + 2,
                    y: topElev - bh.groundwater_depth,
                    text: "▼",
                    mode: "text",
                    textfont: { color: "blue", size: 14 },
                    type: "scatter",
                    hoverinfo: "none",
                    showlegend: false,
                });
            }

            // Draw soil layers
            if (bh.soil_layers && bh.soil_layers.length > 0) {
                bh.soil_layers.forEach((layer) => {
                    const layerTopElev = topElev - layer.depth_from;
                    const layerBottomElev = topElev - layer.depth_to;

                    shapes.push({
                        type: "rect",
                        xref: "x",
                        yref: "y",
                        x0: x - width / 2,
                        y0: layerBottomElev,
                        x1: x + width / 2,
                        y1: layerTopElev,
                        fillcolor: getColorForUSCS(layer.uscs),
                        line: { color: "#333", width: 1 },
                        opacity: 0.9,
                    });
                });
            } else {
                // Draw a blank casing if no layers
                shapes.push({
                    type: "rect",
                    xref: "x",
                    yref: "y",
                    x0: x - width / 2,
                    y0: bottomElev,
                    x1: x + width / 2,
                    y1: topElev,
                    fillcolor: "transparent",
                    line: { color: "#333", width: 1 },
                });
            }
        });

        return {
            data: labels,
            layout: {
                title: "Geological Cross Section",
                font: { family: "Inter, sans-serif" },
                paper_bgcolor: "transparent",
                plot_bgcolor: "white",
                margin: { t: 60, b: 60, l: 60, r: 20 },
                xaxis: {
                    title: "Distance (m)",
                    showgrid: true,
                    zeroline: false,
                },
                yaxis: {
                    title: "Elevation (m)",
                    range: [minElev - 5, maxElev + 10], // Pad top and bottom
                    showgrid: true,
                    gridcolor: "#eee",
                    zeroline: false,
                },
                shapes: shapes,
                hovermode: "closest",
                showlegend: false,
            },
        };
    }, [boreholes]);

    if (!plotData) {
        return (
            <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)", borderRadius: 8, background: "var(--bg-secondary)" }}>
                <p style={{ color: "var(--text-muted)" }}>Select boreholes with Elevation and Coordinates to generate a cross-section.</p>
            </div>
        );
    }

    return (
        <div style={{ height: 400, width: "100%", border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <Plot
                data={plotData.data}
                layout={plotData.layout}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                config={{ displayModeBar: false }}
            />
        </div>
    );
}
