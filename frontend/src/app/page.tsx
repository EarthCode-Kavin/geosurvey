"use client";

import { useEffect, useState } from "react";
import { projectsApi, surveysApi, boreholesApi } from "@/lib/api";
import type { Project, Survey, Borehole } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";
import Link from "next/link";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [boreholes, setBoreholes] = useState<Borehole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [p, s, b] = await Promise.all([
          projectsApi.list(),
          surveysApi.list(),
          boreholesApi.list(),
        ]);
        setProjects(p);
        setSurveys(s);
        setBoreholes(b);
      } catch {
        // API not available — show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { label: "Total Projects", value: projects.length },
    { label: "Active Surveys", value: surveys.filter((s) => s.processing_status !== "completed").length },
    { label: "Boreholes", value: boreholes.length },
    { label: "Completed", value: surveys.filter((s) => s.processing_status === "completed").length },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 500, marginBottom: 8 }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Geophysical & Geotechnical Survey Analysis Platform
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card" id={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {stat.label}
            </div>
            <div className="font-serif" style={{ fontSize: 36, fontWeight: 400, color: "var(--text-primary)" }}>
              {loading ? "—" : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 48, flexWrap: "wrap" }}>
        <Link href="/projects">
          <button className="btn-primary" id="btn-new-project">
            New Project
          </button>
        </Link>
        <Link href="/surveys">
          <button className="btn-secondary" id="btn-upload-survey">
            Upload Survey
          </button>
        </Link>
        <Link href="/boreholes">
          <button className="btn-secondary" id="btn-add-borehole">
            Add Borehole
          </button>
        </Link>
        <Link href="/dashboard">
          <button className="btn-secondary" id="btn-visualizations">
            Visualizations
          </button>
        </Link>
      </div>

      {/* Recent Projects */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 500 }}>Recent Projects</h2>
          <Link href="/projects" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>
            View all →
          </Link>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading...</div>
        ) : projects.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {projects.slice(0, 6).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: "var(--text-primary)" }}>
              No projects yet
            </div>
            <div style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
              Create your first geophysical survey project to get started.
            </div>
            <Link href="/projects">
              <button className="btn-primary">Create Project</button>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Surveys */}
      {surveys.length > 0 && (
        <div>
          <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 20 }}>Recent Surveys</h2>
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Array</th>
                  <th>Status</th>
                  <th>Engine</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {surveys.slice(0, 5).map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.array_type}</td>
                    <td>
                      <span className={`badge badge-${s.processing_status}`}>
                        {s.processing_status}
                      </span>
                    </td>
                    <td>{s.processing_engine || "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
