// src/components/cards/SeverityCard.jsx
import React from "react";
import { ShieldExclamationIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export default function SeverityCard({ stats }) {
    const items = [
        {
            label: "Critical / Error",
            value: stats.errors || 0,
            icon: ShieldExclamationIcon,
            color: "text-red-500",
            bg: "bg-red-500/10"
        },
        {
            label: "Warnings",
            value: stats.warnings || 0,
            icon: ExclamationTriangleIcon,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10"
        },
        {
            label: "Info",
            value: stats.info || 0,
            icon: InformationCircleIcon,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        }
    ];

    return (
        <div className="panel p-4 rounded-xl shadow flex flex-col gap-4">
            <h2 className="text-lg font-semibold mb-2">Severity Breakdown</h2>

            {items.map(({ label, value, icon: Icon, color, bg }, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg transition hover:bg-white/5"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
                            <Icon className={`w-5 ${color}`} />
                        </div>
                        <span className="text-sm opacity-80">{label}</span>
                    </div>

                    <span className="text-xl font-bold">{value}</span>
                </div>
            ))}
        </div>
    );
}
