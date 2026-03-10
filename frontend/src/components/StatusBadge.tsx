interface StatusBadgeProps {
    status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const badgeClass: Record<string, string> = {
        active: "badge-active",
        pending: "badge-pending",
        uploaded: "badge-pending",
        processing: "badge-processing",
        completed: "badge-completed",
        failed: "badge-failed",
        archived: "badge-archived",
    };

    return (
        <span className={`badge ${badgeClass[status] || "badge-pending"}`}>
            <span className="pulse-dot" style={{ background: "currentColor" }} />
            {status}
        </span>
    );
}
