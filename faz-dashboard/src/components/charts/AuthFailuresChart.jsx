import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

export default function AuthFailuresChart({ stats }) {
    // fallback sample data if backend doesn't send
    const data = stats.authFailures || [
        { hour: "00:00", failures: 2 },
        { hour: "04:00", failures: 5 },
        { hour: "08:00", failures: 14 },
        { hour: "12:00", failures: 9 },
        { hour: "16:00", failures: 7 },
        { hour: "20:00", failures: 11 },
    ];

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

                    <XAxis dataKey="hour" stroke="#888" />
                    <YAxis stroke="#888" />

                    <Tooltip
                        contentStyle={{
                            background: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                    />

                    <Bar
                        dataKey="failures"
                        fill="#ef4444"
                        stroke="#ef4444"
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
