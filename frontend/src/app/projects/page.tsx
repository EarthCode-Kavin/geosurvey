"use client";

import { useEffect, useState } from "react";
import { projectsApi } from "@/lib/api";
import type { Project, ProjectCreate } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<ProjectCreate>({
        name: "",
        description: "",
        client_name: "",
        location_name: "",
        latitude: undefined,
        longitude: undefined,
    });

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            const data = await projectsApi.list();
            setProjects(data);
        } catch {
            // API unavailable
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            await projectsApi.create(form);
            setShowCreate(false);
            setForm({ name: "", description: "", client_name: "", location_name: "" });
            loadProjects();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create project");
        }
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>Projects</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        Manage your geophysical survey projects
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreate(true)} id="btn-create-project">
                    ➕ New Project
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading projects...</div>
            ) : projects.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No projects found</div>
                    <div style={{ color: "var(--text-muted)", marginBottom: 24 }}>
                        Create your first project to begin survey analysis.
                    </div>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>
                        Create Project
                    </button>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Create New Project</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div>
                                    <label className="form-label">Project Name *</label>
                                    <input
                                        className="form-input"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Highway Bridge Site Investigation"
                                        id="input-project-name"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={form.description || ""}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Brief description of the survey project..."
                                        id="input-project-desc"
                                    />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label className="form-label">Client Name</label>
                                        <input
                                            className="form-input"
                                            value={form.client_name || ""}
                                            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                                            placeholder="Client / Organization"
                                            id="input-client-name"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Location</label>
                                        <input
                                            className="form-input"
                                            value={form.location_name || ""}
                                            onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                                            placeholder="Site location"
                                            id="input-location"
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label className="form-label">Latitude</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            step="any"
                                            value={form.latitude ?? ""}
                                            onChange={(e) => setForm({ ...form, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            placeholder="-90 to 90"
                                            id="input-latitude"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Longitude</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            step="any"
                                            value={form.longitude ?? ""}
                                            onChange={(e) => setForm({ ...form, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            placeholder="-180 to 180"
                                            id="input-longitude"
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" id="btn-submit-project">
                                        Create Project
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
