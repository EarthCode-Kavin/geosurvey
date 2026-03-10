"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { projectsApi, processingApi, visualizationApi } from "@/lib/api";
import type { Project, ProcessingResult } from "@/lib/api";

const ResistivityPlot = dynamic(() => import("@/components/visualization/ResistivityPlot"), { ssr: false });
const BoreholeLog = dynamic(() => import("@/components/visualization/BoreholeLog"), { ssr: false });
const SurveyMap = dynamic(() => import("@/components/visualization/SurveyMap"), { ssr: false });

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [results, setResults] = useState<ProcessingResult[]>([]);
    const [mapData, setMapData] = useState<Record<string, unknown> | null>(null);
    const [selectedResult, setSelectedResult] = useState<ProcessingResult | null>(null);
    const [plotData, setPlotData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        projectsApi.list().then(setProjects).catch(() => { }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedProject) {
            visualizationApi.getSurveyMap(selectedProject).then(setMapData).catch(() => setMapData(null));
        }
    }, [selectedProject]);

    async function loadResults(surveyId: number) {
        const r = await processingApi.getResults(surveyId);
        setResults(r);
    }

    async function loadPlotData(resultId: number) {
        const data = await visualizationApi.getResistivitySection(resultId);
        setPlotData(data);
    }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>Visualization Dashboard</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    Interactive visualizations: resistivity sections, 3D models, borehole logs, and survey maps
                </p>
            </div>

            {/* Project Selector */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <label className="form-label" style={{ marginBottom: 0, whiteSpace: "nowrap" }}>
                        Select Project:
                    </label>
                    <select
                        className="form-input"
                        style={{ maxWidth: 400 }}
                        value={selectedProject || ""}
                        onChange={(e) => setSelectedProject(Number(e.target.value) || null)}
                        id="viz-project-selector"
                    >
                        <option value="">Choose a project...</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedProject ? (
                <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Select a project</div>
                    <div style={{ color: "var(--text-muted)" }}>
                        Choose a project above to view its visualizations.
                    </div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Resistivity Section */}
                    <div className="glass-card" style={{ padding: 20, gridColumn: "1 / -1" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Resistivity Section</h3>
                        {plotData ? (
                            <ResistivityPlot data={plotData} />
                        ) : (
                            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                Select a processing result to view the resistivity section.
                            </div>
                        )}
                    </div>

                    {/* Survey Map */}
                    <div className="glass-card" style={{ padding: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🗺️ Survey Map</h3>
                        {mapData ? (
                            <SurveyMap data={mapData} />
                        ) : (
                            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                No map data available.
                            </div>
                        )}
                    </div>

                    {/* Borehole Log */}
                    <div className="glass-card" style={{ padding: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔩 Borehole Log</h3>
                        <BoreholeLog projectId={selectedProject} />
                    </div>

                    {/* Processing Results */}
                    <div className="glass-card" style={{ padding: 20, gridColumn: "1 / -1" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚡ Processing Results</h3>
                        {results.length > 0 ? (
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {results.map((r) => (
                                    <button
                                        key={r.id}
                                        className={selectedResult?.id === r.id ? "btn-primary" : "btn-secondary"}
                                        style={{ fontSize: 13 }}
                                        onClick={() => {
                                            setSelectedResult(r);
                                            loadPlotData(r.id);
                                        }}
                                        id={`result-btn-${r.id}`}
                                    >
                                        Result #{r.id} ({r.engine_type}) — RMS: {r.rms_misfit?.toFixed(2) || "N/A"}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
                                No processing results yet. Run processing on a survey first.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
