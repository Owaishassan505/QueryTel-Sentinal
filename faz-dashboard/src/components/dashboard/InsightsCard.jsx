import React from "react";

export default function InsightsCard({ title, value, color }) {
    return (
        <div className="rounded-xl bg-card shadow-soft hover:shadow-glow transition p-5 border border-borderColor flex flex-col gap-2">
            <span className="text-gray-400 text-sm">{title}</span>
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
        </div>
    );
}
