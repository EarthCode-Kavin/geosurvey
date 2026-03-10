"use client";

interface EngineSelectorProps {
    selected: "simpeg" | "pygimli";
    onChange: (engine: "simpeg" | "pygimli") => void;
}

export default function EngineSelector({ selected, onChange }: EngineSelectorProps) {
    const engines = [
        {
            id: "simpeg" as const,
            name: "SimPEG",
            description: "Simulation and Parameter Estimation in Geophysics",
            color: "var(--accent-blue)",
        },
        {
            id: "pygimli" as const,
            name: "pyGIMLi",
            description: "Geophysical Inversion and Modelling Library",
            color: "var(--accent-emerald)",
        },
    ];

    return (
        <div style={{ display: "flex", gap: 12 }} id="engine-selector">
            {engines.map((eng) => (
                <button
                    key={eng.id}
                    onClick={() => onChange(eng.id)}
                    style={{
                        flex: 1,
                        padding: "16px 20px",
                        borderRadius: 12,
                        border: `2px solid ${selected === eng.id ? eng.color : "var(--border-color)"}`,
                        background: selected === eng.id ? `${eng.color}15` : "var(--bg-card)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                    }}
                    id={`engine-${eng.id}`}
                >
                    <div
                        style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: selected === eng.id ? eng.color : "var(--text-primary)",
                            marginBottom: 4,
                        }}
                    >
                        {eng.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{eng.description}</div>
                </button>
            ))}
        </div>
    );
}
