// src/components/shared/SeverityBadge.jsx
import React from "react";

export default function SeverityBadge({ severity }) {
    if (!severity) return null;
    const sev = severity.toLowerCase();

    let label = sev.toUpperCase();
    let classes =
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold";

    if (sev === "info") {
        classes += " bg-blue-500/10 text-blue-400 border border-blue-500/40";
    } else if (sev === "error") {
        classes += " bg-red-500/10 text-red-400 border border-red-500/40";
    } else if (sev === "warn" || sev === "warning") {
        classes += " bg-yellow-500/10 text-yellow-400 border border-yellow-500/40";
        label = "WARNING";
    } else {
        classes += " bg-gray-500/10 text-gray-300 border border-gray-500/40";
    }

    return <span className={classes}>{label}</span>;
}
