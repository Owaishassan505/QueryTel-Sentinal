import React from "react";
import AnimatedCounter from "../shared/AnimatedCounter";


export default function StatsCard({ title, value, icon = "shield", color = "primary" }) {
    const icons = {
        shield: "🛡️",
        alert: "⚠️",
        fire: "🔥",
        globe: "🌍",
        log: "📄",
        clock: "⏱️",
    };

    // SAFE TAILWIND COLOR MAP (no dynamic classes)
    const colorMap = {
        primary: {
            bg: "bg-primary/20",
            text: "text-primary"
        },
        red: {
            bg: "bg-red-500/20",
            text: "text-red-500"
        },
        blue: {
            bg: "bg-blue-500/20",
            text: "text-blue-500"
        },
        yellow: {
            bg: "bg-yellow-500/20",
            text: "text-yellow-500"
        },
        green: {
            bg: "bg-green-500/20",
            text: "text-green-500"
        }
    };

    const selected = colorMap[color] || colorMap["primary"];

    return (
        <div className="bg-panel border border-borderColor rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-400">{title}</p>
                    <h2 className="text-2xl font-bold text-text mt-1">
                        <AnimatedCounter value={value || 0} />
                    </h2>

                </div>

                <div className={`text-3xl p-3 rounded-lg ${selected.bg} ${selected.text} shadow-inner`}>
                    {icons[icon] || "📊"}
                </div>
            </div>
        </div>
    );
}
