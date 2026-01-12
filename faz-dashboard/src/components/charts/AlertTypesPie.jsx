import React, { useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = [
    "#22C55E",
    "#3B82F6",
    "#F97316",
    "#EF4444",
    "#A855F7",
    "#06B6D4",
    "#FACC15",
    "#10B981",
    "#FB7185",
];

export default function AlertTypesPie({ data = [] }) {
    const [selected, setSelected] = useState(null);

    const clean = data
        .map(d => ({ ...d, count: Number(d.count) || 0 }))
        .filter(d => d.count > 0);

    const total = clean.reduce((a, b) => a + b.count, 0);
    if (!clean.length) return null;

    const displayText = selected
        ? `${selected.count} (${((selected.count / total) * 100).toFixed(1)}%)`
        : total;

    return (
        <PieChart width={240} height={240}>
            <Pie
                data={clean}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={105}
                dataKey="count"
                stroke="#000"
                strokeWidth={3}
                isAnimationActive
                onClick={(slice) => setSelected(slice)}
            >
                {clean.map((entry, index) => (
                    <Cell
                        key={entry.type}
                        fill={COLORS[index % COLORS.length]}
                        cursor="pointer"
                        style={{
                            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.45))",
                            opacity: selected && selected.type !== entry.type ? 0.35 : 1,
                        }}
                    />
                ))}
            </Pie>

            {/* CENTER */}
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={22}
                fontWeight={800}
            >
                {displayText}
            </text>
        </PieChart>
    );
}
