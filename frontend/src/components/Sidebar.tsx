"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/surveys", label: "Surveys" },
    { href: "/boreholes", label: "Boreholes" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar" id="sidebar">
            {/* Logo */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: "var(--text-primary)",
                            color: "var(--bg-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            fontWeight: "bold",
                            fontFamily: "var(--font-serif)"
                        }}
                    >
                        G
                    </div>
                    <div>
                        <div className="font-serif" style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.02em" }}>GeoSurvey</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "20px 8px", overflowY: "auto" }}>
                <div
                    style={{
                        padding: "0 16px",
                        marginBottom: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-muted)",
                    }}
                >
                    Main Menu
                </div>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                    >
                        {item.label}
                    </Link>
                ))}

                <div
                    style={{
                        padding: "24px 16px 12px",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-muted)",
                    }}
                >
                    Tools
                </div>
                <Link
                    href="/dashboard"
                    className="sidebar-link"
                >
                    Visualizations
                </Link>
                <Link
                    href="/surveys"
                    className="sidebar-link"
                >
                    Run Processing
                </Link>
                <a
                    href="/api/docs"
                    target="_blank"
                    rel="noopener"
                    className="sidebar-link"
                >
                    API Docs
                </a>
            </nav>

            {/* Footer */}
            <div
                style={{
                    padding: "16px 24px",
                    borderTop: "1px solid var(--border-color)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="pulse-dot" style={{ background: "var(--accent-emerald)" }} />
                    System Online
                </div>
                <div style={{ marginTop: 4 }}>v1.0.0</div>
            </div>
        </aside>
    );
}
