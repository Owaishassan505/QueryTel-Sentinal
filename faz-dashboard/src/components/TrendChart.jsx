import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function TrendChart({ data, height }) {
    return (
        <div style={{ width: "100%", height }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="errors"
                        stroke="#f87171"
                        strokeWidth={2}
                        name="Errors"
                    />
                    <Line
                        type="monotone"
                        dataKey="warnings"
                        stroke="#facc15"
                        strokeWidth={2}
                        name="Warnings"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
