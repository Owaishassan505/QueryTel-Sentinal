import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

export default function TrafficOverview({ stats }) {
    const data = stats.traffic || [
        { time: "00:00", inbound: 120, outbound: 90 },
        { time: "04:00", inbound: 200, outbound: 140 },
        { time: "08:00", inbound: 350, outbound: 280 },
        { time: "12:00", inbound: 500, outbound: 430 },
        { time: "16:00", inbound: 320, outbound: 290 },
        { time: "20:00", inbound: 280, outbound: 240 },
    ];

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="inbound" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="outbound" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="time" stroke="#888" />
                    <YAxis stroke="#888" />

                    <Tooltip
                        contentStyle={{
                            background: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                    />

                    <Area
                        type="monotone"
                        dataKey="inbound"
                        stroke="#3b82f6"
                        fill="url(#inbound)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="outbound"
                        stroke="#10b981"
                        fill="url(#outbound)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
