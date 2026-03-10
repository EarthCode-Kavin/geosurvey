"use client";

import { useEffect, useState } from "react";
import { surveysApi, projectsApi, processingApi } from "@/lib/api";
import type { Survey, Project, SurveyCreate } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import ManualDataEntry from "@/components/ManualDataEntry";
import EngineSelector from "@/components/EngineSelector";
import { SIMPEG_METHODS } from "@/lib/simpegMethods";

export default function SurveysPage() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const [engine, setEngine] = useState<"simpeg" | "pygimli">("simpeg");
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState<SurveyCreate>({
        project_id: 0,
        name: "",
        array_type: SIMPEG_METHODS[0].id,
        survey_type: SIMPEG_METHODS[0].category,
    });
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [s, p] = await Promise.all([surveysApi.list(), projectsApi.list()]);
            setSurveys(s);
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
            const survey = await surveysApi.create(form);
            if (uploadFile) {
                await surveysApi.upload(survey.id, uploadFile);
            }
            setShowCreate(false);
            setForm({ project_id: 0, name: "", array_type: SIMPEG_METHODS[0].id, survey_type: SIMPEG_METHODS[0].category });
            setUploadFile(null);
            loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create survey");
        }
    }

    async function handleProcess(surveyId: number) {
        setProcessing(true);
        try {
            await processingApi.run({ survey_id: surveyId, engine, method: "inversion" });
            loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Processing failed");
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>Surveys</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        Resistivity survey data management and processing
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreate(true)} id="btn-create-survey">
                    ➕ New Survey
                </button>
            </div>

            {/* Survey list */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading...</div>
            ) : surveys.length > 0 ? (
                <div className="glass-card" style={{ overflow: "hidden" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Project</th>
                                <th>Array</th>
                                <th>File</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {surveys.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                                    <td>{projects.find((p) => p.id === s.project_id)?.name || s.project_id}</td>
                                    <td>{s.array_type}</td>
                                    <td>{s.original_filename || "No file"}</td>
                                    <td><StatusBadge status={s.processing_status} /></td>
                                    <td>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {s.processing_status !== "completed" && s.original_filename && (
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: "6px 12px", fontSize: 12 }}
                                                    onClick={() => setSelectedSurvey(s)}
                                                    id={`btn-process-${s.id}`}
                                                >
                                                    ⚡ Process
                                                </button>
                                            )}
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: "6px 12px", fontSize: 12, color: "var(--accent-red)" }}
                                                onClick={async () => {
                                                    if (confirm("Delete this survey?")) {
                                                        await surveysApi.delete(s.id);
                                                        loadData();
                                                    }
                                                }}
                                                id={`btn-delete-${s.id}`}
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
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No surveys yet</div>
                    <div style={{ color: "var(--text-muted)", marginBottom: 24 }}>Upload your first survey data to begin analysis.</div>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>Upload Survey</button>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>New Survey</h2>
                        <form onSubmit={handleCreate}>
                            {(() => {
                                const activeMethod = SIMPEG_METHODS.find(m => m.id === form.array_type) || SIMPEG_METHODS[0];
                                const categories = Array.from(new Set(SIMPEG_METHODS.map(m => m.category)));
                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        <div>
                                            <label className="form-label">Project *</label>
                                            <select
                                                className="form-input"
                                                required
                                                value={form.project_id}
                                                onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}
                                                id="select-project"
                                            >
                                                <option value={0}>Select a project...</option>
                                                {projects.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="form-label">Survey Name *</label>
                                            <input
                                                className="form-input"
                                                required
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                placeholder="e.g. Profile Line 1"
                                                id="input-survey-name"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Method *</label>
                                            <select
                                                className="form-input"
                                                value={form.array_type}
                                                onChange={(e) => {
                                                    const method = SIMPEG_METHODS.find(m => m.id === e.target.value);
                                                    setForm({ ...form, array_type: e.target.value, survey_type: method?.category || "Unknown" });
                                                }}
                                                id="select-method-type"
                                            >
                                                {categories.map(cat => (
                                                    <optgroup key={cat} label={cat}>
                                                        {SIMPEG_METHODS.filter(m => m.category === cat).map(m => (
                                                            <option key={m.id} value={m.id}>{m.title}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                            {activeMethod && (
                                                <div style={{ marginTop: 8, padding: 12, background: "var(--bg-secondary)", borderRadius: 6, fontSize: 13, border: "1px solid var(--border-color)" }}>
                                                    <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                                                        {activeMethod.title}
                                                    </div>
                                                    <div style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
                                                        {activeMethod.description}
                                                    </div>
                                                    <div style={{ color: "var(--text-muted)", fontSize: 12, borderTop: "1px solid var(--border-color)", paddingTop: 8 }}>
                                                        <strong>Citation:</strong>{" "}
                                                        <a href={activeMethod.citationUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
                                                            {activeMethod.citation}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ marginBottom: 12 }}>Manual Data Entry</label>
                                            <ManualDataEntry arrayType={form.array_type} onDataChange={setUploadFile} />
                                        </div>
                                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                                            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </form>
                    </div>
                </div>
            )}

            {/* Processing Modal */}
            {selectedSurvey && (
                <div className="modal-overlay" onClick={() => setSelectedSurvey(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Run Processing</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14 }}>
                            Survey: {selectedSurvey.name} ({selectedSurvey.array_type})
                        </p>
                        <div style={{ marginBottom: 24 }}>
                            <label className="form-label">Select Engine</label>
                            <EngineSelector selected={engine} onChange={setEngine} />
                        </div>
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => setSelectedSurvey(null)}>Cancel</button>
                            <button
                                className="btn-primary"
                                disabled={processing}
                                onClick={() => {
                                    handleProcess(selectedSurvey.id);
                                    setSelectedSurvey(null);
                                }}
                                id="btn-start-processing"
                            >
                                {processing ? "Processing..." : "⚡ Start Processing"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
