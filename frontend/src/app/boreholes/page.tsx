"use client";

import { useEffect, useState } from "react";
import { boreholesApi, projectsApi } from "@/lib/api";
import type { Borehole, Project, BoreholeCreate, SoilLayer, SPTValue } from "@/lib/api";
import BoreholeMap from "@/components/visualization/BoreholeMap";
import BoreholeCrossSection from "@/components/visualization/BoreholeCrossSection";
import SingleBoreholeLog from "@/components/visualization/SingleBoreholeLog";

export default function BoreholesPage() {
    const [boreholes, setBoreholes] = useState<Borehole[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
    const [selectedLog, setSelectedLog] = useState<Borehole | null>(null);
    const [form, setForm] = useState<BoreholeCreate>({
        project_id: 0,
        name: "",
        total_depth: 10,
        soil_layers: [],
        spt_values: [],
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [b, p] = await Promise.all([boreholesApi.list(), projectsApi.list()]);
            setBoreholes(b);
            setProjects(p);
        } catch {
            // API error
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            await boreholesApi.create(form);
            setShowCreate(false);
            setForm({ project_id: 0, name: "", total_depth: 10, soil_layers: [], spt_values: [] });
            loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed");
        }
    }

    function addSoilLayer() {
        const layers = form.soil_layers || [];
        const lastDepth = layers.length > 0 ? layers[layers.length - 1].depth_to : 0;
        setForm({
            ...form,
            soil_layers: [...layers, { depth_from: lastDepth, depth_to: lastDepth + 2, description: "", uscs: "" }],
        });
    }

    function updateLayer(idx: number, field: keyof SoilLayer, value: string | number) {
        const layers = [...(form.soil_layers || [])];
        layers[idx] = { ...layers[idx], [field]: value };
        setForm({ ...form, soil_layers: layers });
    }

    function addSPT() {
        const spts = form.spt_values || [];
        setForm({
            ...form,
            spt_values: [...spts, { depth: 0, n_value: 0 }],
        });
    }

    function updateSPT(idx: number, field: keyof SPTValue, value: number) {
        const spts = [...(form.spt_values || [])];
        spts[idx] = { ...spts[idx], [field]: value };
        setForm({ ...form, spt_values: spts });
    }

    const filteredBoreholes = selectedProjectId === 0
        ? boreholes
        : boreholes.filter(b => b.project_id === selectedProjectId);

    return (
        <div>
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>Boreholes</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        Geotechnical borehole log management & visualization
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <select
                        className="form-input"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                        style={{ minWidth: 200 }}
                    >
                        <option value={0}>All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button className="btn-primary" onClick={() => setShowCreate(true)} id="btn-create-borehole">
                        ➕ New Borehole
                    </button>
                </div>
            </div>

            {/* Visualizations (only if boreholes exist) */}
            {filteredBoreholes.length > 0 && !loading && (
                <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Borehole Locations</h3>
                        <BoreholeMap boreholes={filteredBoreholes} onSelectBorehole={(b) => setSelectedLog(b)} />
                    </div>
                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Geological Cross Section</h3>
                        <BoreholeCrossSection boreholes={filteredBoreholes} />
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading...</div>
            ) : filteredBoreholes.length > 0 ? (
                <div className="glass-card no-print" style={{ overflow: "hidden" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Project</th>
                                <th>Depth (m)</th>
                                <th>GW Depth (m)</th>
                                <th>Method</th>
                                <th>Layers</th>
                                <th>SPT Values</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boreholes.map((b) => (
                                <tr key={b.id}>
                                    <td style={{ fontWeight: 500 }}>{b.name}</td>
                                    <td>{projects.find((p) => p.id === b.project_id)?.name || b.project_id}</td>
                                    <td>{b.total_depth}</td>
                                    <td>{b.groundwater_depth ?? "—"}</td>
                                    <td>{b.drilling_method || "—"}</td>
                                    <td>{b.soil_layers?.length || 0}</td>
                                    <td>{b.spt_values?.length || 0}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: "6px 12px", fontSize: 12 }}
                                                onClick={() => setSelectedLog(b)}
                                            >
                                                📄 View Log
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: "6px 12px", fontSize: 12, color: "var(--accent-red)" }}
                                                onClick={async () => {
                                                    if (confirm("Delete this borehole?")) {
                                                        await boreholesApi.delete(b.id);
                                                        loadData();
                                                    }
                                                }}
                                                id={`btn-delete-bh-${b.id}`}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔩</div>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No boreholes yet</div>
                    <div style={{ color: "var(--text-muted)", marginBottom: 24 }}>Add geotechnical borehole data to your projects.</div>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>Add Borehole</button>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: "85vh" }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>New Borehole Log</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div>
                                    <label className="form-label">Project *</label>
                                    <select className="form-input" required value={form.project_id} onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })} id="select-bh-project">
                                        <option value={0}>Select project...</option>
                                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label className="form-label">Borehole Name *</label>
                                        <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="BH-01" id="input-bh-name" />
                                    </div>
                                    <div>
                                        <label className="form-label">Total Depth (m) *</label>
                                        <input className="form-input" type="number" required step="any" value={form.total_depth} onChange={(e) => setForm({ ...form, total_depth: parseFloat(e.target.value) })} id="input-bh-depth" />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label className="form-label">Groundwater Depth (m)</label>
                                        <input className="form-input" type="number" step="any" value={form.groundwater_depth ?? ""} onChange={(e) => setForm({ ...form, groundwater_depth: e.target.value ? parseFloat(e.target.value) : undefined })} id="input-gw-depth" />
                                    </div>
                                    <div>
                                        <label className="form-label">Drilling Method</label>
                                        <input className="form-input" value={form.drilling_method || ""} onChange={(e) => setForm({ ...form, drilling_method: e.target.value })} placeholder="Rotary / Percussion" id="input-drill-method" />
                                    </div>
                                </div>

                                {/* Soil Layers */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <label className="form-label" style={{ marginBottom: 0 }}>Soil Layers</label>
                                        <button type="button" className="btn-secondary" style={{ padding: "4px 12px", fontSize: 12 }} onClick={addSoilLayer}>+ Add Layer</button>
                                    </div>
                                    {(form.soil_layers || []).map((layer, i) => (
                                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", gap: 8, marginBottom: 8 }}>
                                            <input className="form-input" type="number" step="any" placeholder="From" value={layer.depth_from} onChange={(e) => updateLayer(i, "depth_from", parseFloat(e.target.value))} />
                                            <input className="form-input" type="number" step="any" placeholder="To" value={layer.depth_to} onChange={(e) => updateLayer(i, "depth_to", parseFloat(e.target.value))} />
                                            <input className="form-input" placeholder="Description" value={layer.description} onChange={(e) => updateLayer(i, "description", e.target.value)} />
                                            <input className="form-input" placeholder="USCS" value={layer.uscs || ""} onChange={(e) => updateLayer(i, "uscs", e.target.value)} />
                                        </div>
                                    ))}
                                </div>

                                {/* SPT Values */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <label className="form-label" style={{ marginBottom: 0 }}>SPT Values</label>
                                        <button type="button" className="btn-secondary" style={{ padding: "4px 12px", fontSize: 12 }} onClick={addSPT}>+ Add SPT</button>
                                    </div>
                                    {(form.spt_values || []).map((spt, i) => (
                                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                            <input className="form-input" type="number" step="any" placeholder="Depth (m)" value={spt.depth} onChange={(e) => updateSPT(i, "depth", parseFloat(e.target.value))} />
                                            <input className="form-input" type="number" placeholder="N-value" value={spt.n_value} onChange={(e) => updateSPT(i, "n_value", parseInt(e.target.value))} />
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" id="btn-submit-borehole">Create Borehole</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Single Borehole Log Modal */
                /* Using a large, print-friendly overlay */
                selectedLog && (
                    <div
                        className="modal-overlay"
                        style={{ background: "rgba(0,0,0,0.8)", zIndex: 9999, alignItems: "flex-start", paddingTop: 40, paddingBottom: 40 }}
                        onClick={() => setSelectedLog(null)}
                    >
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: "95%", maxWidth: 1000, margin: "0 auto", padding: 0, overflow: "hidden" }}
                        >
                            {/* Custom Close Button for the Log View */}
                            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                                <button className="btn-secondary" onClick={() => setSelectedLog(null)}>✕ Close View</button>
                            </div>
                            <div style={{ padding: 24, maxHeight: "calc(100vh - 140px)", overflowY: "auto", background: "#fff" }}>
                                {/* Pass the project name in dynamically if possible for the header */}
                                <SingleBoreholeLog borehole={{ ...selectedLog, project_name: projects.find(p => p.id === selectedLog.project_id)?.name }} />
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}
