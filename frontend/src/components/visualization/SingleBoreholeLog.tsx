"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div>Loading Graph...</div> });

interface SoilLayer {
    depth_from: number;
    depth_to: number;
    description: string;
    uscs?: string | null;
}

interface SPTValue {
    depth: number;
    n_value: number;
}

interface Borehole {
    id: number;
    name: string;
    project_name?: string;
    latitude?: number | null;
    longitude?: number | null;
    elevation?: number | null;
    total_depth: number;
    groundwater_depth?: number | null;
    drilling_method?: string | null;
    drilling_date?: string | null;
    client_name?: string;
    contractor?: string;
    soil_layers?: SoilLayer[];
    spt_values?: SPTValue[];
}

interface SingleBoreholeLogProps {
    borehole: Borehole;
}

const getColorForUSCS = (uscs?: string | null) => {
    if (!uscs) return "#f4f4f4";
    const type = uscs.toUpperCase();
    if (type.includes("CL") || type.includes("CH")) return "#e5c07b"; // Clay
    if (type.includes("ML") || type.includes("MH")) return "#d19a66"; // Silt
    if (type.includes("SW") || type.includes("SP") || type.includes("SM") || type.includes("SC")) return "#e5c07b"; // Sand
    if (type.includes("GW") || type.includes("GP") || type.includes("GM") || type.includes("GC")) return "#98c379"; // Gravel
    if (type.includes("PT") || type.includes("OH") || type.includes("OL")) return "#56b6c2"; // Peat/Organic
    return "#e2e8f0"; // Default
};

export default function SingleBoreholeLog({ borehole }: SingleBoreholeLogProps) {
    const handlePrint = () => {
        window.print();
    };

    // Prepare SPT Plotly data
    const sptData = useMemo(() => {
        if (!borehole.spt_values || borehole.spt_values.length === 0) return null;

        return {
            x: borehole.spt_values.map((spt) => spt.n_value),
            y: borehole.spt_values.map((spt) => spt.depth),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "red", size: 8 },
            line: { color: "black", width: 2 },
            name: "SPT N-Value",
        };
    }, [borehole.spt_values]);

    return (
        <div className="printable-log">
            {/* Action Bar (Hidden when printing via CSS) */}
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button className="btn-primary" onClick={handlePrint} style={{ padding: "8px 16px" }}>
                    🖨 Print / Save as PDF
                </button>
            </div>

            {/* Header / Title Block */}
            <div style={{ border: "2px solid #000", marginBottom: 16 }}>
                <div style={{ padding: 16, borderBottom: "2px solid #000", background: "#f8f9fa" }}>
                    <h1 style={{ margin: 0, fontSize: 24, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>Geotechnical Borehole Log</h1>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid #000" }}>
                    <div style={{ padding: 8, borderRight: "1px solid #000" }}>
                        <strong>Project: </strong> {borehole.project_name || "N/A"}
                    </div>
                    <div style={{ padding: 8 }}>
                        <strong>Borehole ID: </strong> <span style={{ fontSize: 18, fontWeight: "bold", color: "var(--accent-red)" }}>{borehole.name}</span>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "2px solid #000" }}>
                    <div style={{ padding: 8, borderRight: "1px solid #000" }}>
                        <strong>Date Started: </strong> {borehole.drilling_date ? format(new Date(borehole.drilling_date), "PP") : "N/A"}
                    </div>
                    <div style={{ padding: 8, borderRight: "1px solid #000" }}>
                        <strong>Method: </strong> {borehole.drilling_method || "N/A"}
                    </div>
                    <div style={{ padding: 8 }}>
                        <strong>Total Depth: </strong> {borehole.total_depth} m
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div style={{ padding: 8, borderRight: "1px solid #000" }}>
                        <strong>Elevation: </strong> {borehole.elevation ? `${borehole.elevation} m` : "N/A"}
                    </div>
                    <div style={{ padding: 8, borderRight: "1px solid #000" }}>
                        <strong>Coord: </strong> {borehole.latitude ? `${borehole.latitude.toFixed(5)}, ${borehole.longitude?.toFixed(5)}` : "N/A"}
                    </div>
                    <div style={{ padding: 8 }}>
                        <strong>Groundwater: </strong> {borehole.groundwater_depth ? `▼ ${borehole.groundwater_depth} m` : "Dry"}
                    </div>
                </div>
            </div>

            {/* Stratigraphy & SPT Section */}
            <div style={{ display: "flex", border: "2px solid #000", height: 600 }}>
                {/* Visual Scale and Layers */}
                <div style={{ flex: 1, borderRight: "2px solid #000", display: "flex", flexDirection: "column" }}>
                    {/* Column Headers */}
                    <div style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr", borderBottom: "2px solid #000", fontWeight: "bold", background: "#f8f9fa", textAlign: "center" }}>
                        <div style={{ padding: 8, borderRight: "1px solid #000" }}>Depth (m)</div>
                        <div style={{ padding: 8, borderRight: "1px solid #000" }}>USCS</div>
                        <div style={{ padding: 8 }}>Material Description</div>
                    </div>

                    {/* Layers Container (Scale relative to max depth) */}
                    <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
                        {(borehole.soil_layers || []).map((layer, idx) => {
                            const totalH = borehole.total_depth;
                            const topPct = (layer.depth_from / totalH) * 100;
                            const heightPct = ((layer.depth_to - layer.depth_from) / totalH) * 100;

                            return (
                                <div key={idx} style={{
                                    position: "absolute",
                                    top: `${topPct}%`,
                                    height: `${heightPct}%`,
                                    width: "100%",
                                    display: "grid",
                                    gridTemplateColumns: "60px 80px 1fr",
                                    borderBottom: "1px solid #999"
                                }}>
                                    <div style={{ borderRight: "1px solid #000", borderLeft: "4px solid #000", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                                        {layer.depth_to.toFixed(1)}
                                    </div>
                                    <div style={{
                                        background: getColorForUSCS(layer.uscs),
                                        borderRight: "1px solid #000",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "bold",
                                        color: "white",
                                        textShadow: "0px 1px 2px rgba(0,0,0,0.5)"
                                    }}>
                                        {layer.uscs || "N/A"}
                                    </div>
                                    <div style={{ padding: "8px 12px", fontSize: 13, background: "#fff" }}>
                                        <strong>{layer.uscs}: </strong>{layer.description}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SPT Plotly Graph */}
                <div style={{ width: "250px", position: "relative", background: "#fff" }}>
                    <div style={{ padding: 8, borderBottom: "2px solid #000", fontWeight: "bold", background: "#f8f9fa", textAlign: "center", height: "auto" }}>
                        SPT N-Value
                    </div>
                    {sptData ? (
                        <Plot
                            data={[sptData as any]}
                            layout={{
                                margin: { t: 0, r: 10, l: 30, b: 30 },
                                yaxis: { autorange: "reversed", range: [0, borehole.total_depth], title: "Depth (m)", zeroline: false },
                                xaxis: { title: "N-Value", side: "top", range: [0, 50], zeroline: false, showgrid: true, gridcolor: "#eee" },
                                hovermode: "closest",
                                paper_bgcolor: "transparent",
                                plot_bgcolor: "transparent",
                            }}
                            useResizeHandler={true}
                            style={{ width: "100%", height: "calc(100% - 37px)" }}
                            config={{ displayModeBar: false }}
                        />
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>
                            No SPT Data
                        </div>
                    )}
                </div>
            </div>

            {/* Print specific CSS hidden in normal view but active during window.print() */}
            <style jsx global>{`
                @media print {
                    @page { size: portrait; margin: 1cm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    .printable-log { 
                        width: 100%; 
                        page-break-inside: avoid;
                    }
                    /* Ensure headers/sidebars of the main app are hidden when printing */
                    #sidebar, .top-bar-container { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    );
}
