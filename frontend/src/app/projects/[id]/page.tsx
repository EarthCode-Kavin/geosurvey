"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { projectsApi, surveysApi, boreholesApi } from "@/lib/api";
import type { Project, Survey, Borehole } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = Number(params.id);

    const [project, setProject] = useState<Project | null>(null);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [boreholes, setBoreholes] = useState<Borehole[]>([]);
    const [activeTab, setActiveTab] = useState<"surveys" | "boreholes" | "results">("surveys");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [p, s, b] = await Promise.all([
                    projectsApi.get(projectId),
                    surveysApi.list(projectId),
                    boreholesApi.list(projectId),
                ]);
                setProject(p);
                setSurveys(s);
                setBoreholes(b);
            } catch {
                // API error
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [projectId]);

    if (loading) return <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
    if (!project) return <div style={{ padding: 60, textAlign: "center" }}>Project not found</div>;

    const tabs = [
        { id: "surveys" as const, label: "Surveys", count: surveys.length },
        { id: "boreholes" as const, label: "Boreholes", count: boreholes.length },
        { id: "results" as const, label: "Results", count: surveys.filter((s) => s.processing_status === "completed").length },
    ];

    return (
        <div>
            {/* Breadcrumb */}
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                <Link href="/projects" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
                    Projects
                </Link>
                {" / "}
                {project.name}
            </div>

            {/* Header */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{project.name}</h1>
                        {project.description && (
                            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 12, maxWidth: 600 }}>
                                {project.description}
                            </p>
                        )}
                        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-muted)" }}>
                            {project.client_name && <span>👤 {project.client_name}</span>}
                            {project.location_name && <span>📍 {project.location_name}</span>}
                            {project.latitude && <span>🌐 {project.latitude.toFixed(4)}, {project.longitude?.toFixed(4)}</span>}
                            <span>📅 {new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <StatusBadge status={project.status} />
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "10px 10px 0 0",
                            border: "1px solid var(--border-color)",
                            borderBottom: activeTab === tab.id ? "2px solid var(--accent-blue)" : "1px solid var(--border-color)",
                            background: activeTab === tab.id ? "var(--bg-card)" : "transparent",
                            color: activeTab === tab.id ? "var(--accent-blue)" : "var(--text-muted)",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 14,
                            transition: "all 0.2s ease",
                        }}
                        id={`tab-${tab.id}`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="glass-card" style={{ overflow: "hidden" }}>
                {activeTab === "surveys" && (
                    surveys.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Array Type</th>
                                    <th>File</th>
                                    <th>Status</th>
                                    <th>Engine</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {surveys.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 500 }}>{s.name}</td>
                                        <td>{s.array_type}</td>
                                        <td>{s.original_filename || "—"}</td>
                                        <td><StatusBadge status={s.processing_status} /></td>
                                        <td>{s.processing_engine || "—"}</td>
                                        <td style={{ color: "var(--text-muted)" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                            No surveys yet. <Link href="/surveys" style={{ color: "var(--accent-blue)" }}>Add one →</Link>
                        </div>
                    )
                )}

                {activeTab === "boreholes" && (
                    boreholes.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Depth (m)</th>
                                    <th>GW Depth (m)</th>
                                    <th>Method</th>
                                    <th>Layers</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boreholes.map((b) => (
                                    <tr key={b.id}>
                                        <td style={{ fontWeight: 500 }}>{b.name}</td>
                                        <td>{b.total_depth}</td>
                                        <td>{b.groundwater_depth ?? "—"}</td>
                                        <td>{b.drilling_method || "—"}</td>
                                        <td>{b.soil_layers?.length || 0}</td>
                                        <td style={{ color: "var(--text-muted)" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                            No boreholes yet. <Link href="/boreholes" style={{ color: "var(--accent-blue)" }}>Add one →</Link>
                        </div>
                    )
                )}

                {activeTab === "results" && (
                    <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                        {surveys.some((s) => s.processing_status === "completed")
                            ? "Processing results are available. View them in the Visualizations dashboard."
                            : "No completed processing results yet. Run processing on a survey to see results here."}
                    </div>
                )}
            </div>
        </div>
    );
}
