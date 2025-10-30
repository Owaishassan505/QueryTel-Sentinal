import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function Analysis() {
    const [stats, setStats] = useState({
        info: 0,
        errors: 0,
        warnings: 0,
        total: 0,
    });
    const [connected, setConnected] = useState(false);
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("http://10.106.87.146:3320/logs/stats");
                if (!res.ok) throw new Error("Network response not ok");
                const data = await res.json();
                setStats(data);
                setConnected(true);

                // Append or refresh trend chart data
                setTrendData((prev) => {
                    const now = new Date().toLocaleTimeString();
                    const newPoint = {
                        time: now,
                        info: data.info,
                        errors: data.errors,
                        warnings: data.warnings,
                    };
                    const updated = [...prev, newPoint];
                    return updated.slice(-10); // keep last 10 points
                });
            } catch (err) {
                console.error("❌ Failed to fetch stats:", err);
                setConnected(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 text-white">
            <h1 className="text-2xl font-bold mb-6">📊 Log Analysis</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gray-800 p-6 rounded-lg text-center shadow-md border border-gray-700">
                    <h3 className="text-blue-400 font-semibold text-lg">Information Logs</h3>
                    <p className="text-3xl font-bold mt-2">{stats.info}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center shadow-md border border-gray-700">
                    <h3 className="text-red-400 font-semibold text-lg">Error Logs</h3>
                    <p className="text-3xl font-bold mt-2">{stats.errors}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center shadow-md border border-gray-700">
                    <h3 className="text-yellow-400 font-semibold text-lg">Warning Logs</h3>
                    <p className="text-3xl font-bold mt-2">{stats.warnings}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center shadow-md border border-gray-700">
                    <h3 className="text-green-400 font-semibold text-lg">Total Logs</h3>
                    <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
            </div>

            {/* Total */}
            <div className="text-center text-gray-400 mb-6">
                Status:{" "}
                {connected ? (
                    <span className="text-green-400 font-semibold">🟢 Connected</span>
                ) : (
                    <span className="text-red-400 font-semibold">🔴 Disconnected</span>
                )}
                <br />
                Total logs processed:{" "}
                <strong className="text-white">{stats.total}</strong>
            </div>

            {/* Trend Graphs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Error Trend */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
                    <h3 className="text-red-400 font-semibold mb-3">Error Trend</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="time" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }} />
                            <Line
                                type="monotone"
                                dataKey="errors"
                                stroke="#f87171"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Warning Trend */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
                    <h3 className="text-yellow-400 font-semibold mb-3">Warning Trend</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="time" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }} />
                            <Line
                                type="monotone"
                                dataKey="warnings"
                                stroke="#facc15"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Info Trend */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
                    <h3 className="text-blue-400 font-semibold mb-3">Info Trend</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="time" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }} />
                            <Line
                                type="monotone"
                                dataKey="info"
                                stroke="#60a5fa"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
