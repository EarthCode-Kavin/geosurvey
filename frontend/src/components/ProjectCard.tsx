import Link from "next/link";
import type { Project } from "@/lib/api";

interface ProjectCardProps {
    project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const statusColors: Record<string, string> = {
        active: "badge-active",
        completed: "badge-completed",
        archived: "badge-archived",
    };

    return (
        <Link href={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
            <div className="glass-card" style={{ padding: 24, cursor: "pointer" }} id={`project-card-${project.id}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)" }}>
                        {project.name}
                    </h3>
                    <span className={`badge ${statusColors[project.status] || "badge-pending"}`}>
                        <span className="pulse-dot" style={{ background: "currentColor" }} />
                        {project.status}
                    </span>
                </div>

                {project.description && (
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                        {project.description.length > 100 ? project.description.slice(0, 100) + "..." : project.description}
                    </p>
                )}

                <div style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--text-muted)", flexWrap: "wrap" }}>
                    {project.client_name && (
                        <span>{project.client_name}</span>
                    )}
                    {project.location_name && (
                        <span>• {project.location_name}</span>
                    )}
                    <span>
                        • {new Date(project.created_at).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </Link>
    );
}
