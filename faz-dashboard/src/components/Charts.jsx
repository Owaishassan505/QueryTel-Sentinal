// src/components/Charts.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Charts({ logs }) {
    if (!logs || logs.length === 0) {
        return <p className="text-gray-400">No data available</p>;
    }

    const data = logs.map((log) => ({
        time: new Date(log.timestamp).toLocaleTimeString(),
        severity: log.severity,
    }));

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="severity" stroke="#3b82f6" />
            </LineChart>
        </ResponsiveContainer>
    );
}
