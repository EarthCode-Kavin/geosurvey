"use client";

import { useState } from "react";

export default function TopBar() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <header className="topbar" id="topbar">
            <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 16 }}>
                {/* Search */}
                <div style={{ flex: 1, maxWidth: 480 }}>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: 16 }}
                            id="global-search"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
                    <button
                        className="btn-secondary"
                        style={{ padding: "6px 12px", fontSize: 13, background: "transparent", border: "none", boxShadow: "none" }}
                        id="notification-btn"
                    >
                        Notifications
                    </button>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                        }}
                        id="user-avatar"
                    >
                        GS
                    </div>
                </div>
            </div>
        </header>
    );
}
