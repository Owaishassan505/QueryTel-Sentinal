import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function MostActiveDevicesChart() {
    const [data, setData] = useState([]);

    useEffect(() => {
        axios.get("/api/top/devices").then((res) => {
            if (res.data?.ok) {
                setData(
                    res.data.data.map((d) => ({
                        name: d._id,
                        value: d.count,
                    }))
                );
            }
        });
    }, []);

    if (!data.length) return null;

    return (
        <div className="h-[240px] w-full">
            <ResponsiveContainer width="40%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                >
                    {/* GRID (DOTTED, DARK) */}
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.12)"
                    />

                    {/* X AXIS */}
                    <XAxis
                        dataKey="name"
                        tick={{ fill: "#cbd5e1", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    {/* Y AXIS */}
                    <YAxis
                        tick={{ fill: "#cbd5e1", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    {/* TOOLTIP */}
                    <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        contentStyle={{
                            background: "#020617",
                            border: "1px solid #334155",
                            borderRadius: 6,
                            color: "#fff",
                            fontSize: 12,
                        }}
                    />

                    {/* BARS */}
                    <Bar
                        dataKey="value"
                        fill="#3B82F6"       // 🔵 SAME BLUE AS IMAGE
                        radius={[4, 4, 0, 0]}
                        barSize={38}        // SAME BAR WIDTH
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
