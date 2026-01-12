import React, { useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = {
    critical: "#FF3B3B",
    high: "#FF9F0A",
    medium: "#22C55E",
    low: "#3B82F6",
};

export default function SeverityDonut({ stats = {} }) {
    const [selected, setSelected] = useState(null);

    const data = [
        { name: "Critical", key: "critical", value: Number(stats.critical) || 0 },
        { name: "High", key: "high", value: Number(stats.high) || 0 },
        { name: "Medium", key: "medium", value: Number(stats.medium) || 0 },
        { name: "Low", key: "low", value: Number(stats.low) || 0 },
    ].filter(d => d.value > 0);

    const total = data.reduce((a, b) => a + b.value, 0);

    if (!data.length) return null;

    const displayText = selected
        ? `${selected.value} (${((selected.value / total) * 100).toFixed(1)}%)`
        : total;

    return (
        <PieChart width={240} height={240}>
            <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={105}
                dataKey="value"
                stroke="#000"
                strokeWidth={3}
                isAnimationActive
                onClick={(slice) => setSelected(slice)}
            >
                {data.map((entry) => (
                    <Cell
                        key={entry.key}
                        fill={COLORS[entry.key]}
                        cursor="pointer"
                        style={{
                            filter:
                                entry.key === "critical"
                                    ? "drop-shadow(0 0 14px rgba(255,0,0,0.9))"
                                    : "drop-shadow(0 0 8px rgba(255,255,255,0.4))",
                            opacity: selected && selected.key !== entry.key ? 0.35 : 1,
                        }}
                    />
                ))}
            </Pie>

            {/* CENTER TEXT */}
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
