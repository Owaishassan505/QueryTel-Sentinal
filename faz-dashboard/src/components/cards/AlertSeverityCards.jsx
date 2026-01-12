import React from "react";

export default function AlertSeverityCards({ stats }) {
    const cards = [
        {
            label: "Total Alerts",
            value: stats?.total || 0,
            color: "from-red-600 to-red-800",
            border: "border-red-700",
        },
        {
            label: "Errors",
            value: stats?.errors || 0,
            color: "from-[#D0021B] to-[#8B0000]",
            border: "border-red-800",
        },
        {
            label: "Warnings",
            value: stats?.warnings || 0,
            color: "from-yellow-600 to-yellow-800",
            border: "border-yellow-700",
        },
        {
            label: "Info",
            value: stats?.info || 0,
            color: "from-blue-600 to-blue-800",
            border: "border-blue-700",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className={`
                        bg-gradient-to-br ${card.color} 
                        border ${card.border}
                        p-5 rounded-xl
                        shadow-[0_0_18px_rgba(0,0,0,0.6)]
                        hover:shadow-[0_0_22px_rgba(255,0,0,0.4)]
                        transition-all duration-300
                        text-white
                    `}
                >
                    <div className="text-sm uppercase tracking-wide opacity-80">
                        {card.label}
                    </div>

                    <div className="text-3xl font-bold mt-2">
                        {card.value}
                    </div>
                </div>
            ))}
        </div>
    );
}
