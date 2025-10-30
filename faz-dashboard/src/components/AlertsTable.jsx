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
    const [stats, setStats] = useState({ info: 0, errors: 0, warnings: 0, total: 0 });
    const [timeseries, setTimeseries] = useState([]);
    const [raw, setRaw] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("http://10.106.87.146:3320/logs/stats");
                if (!res.ok) throw new Error("Network response not ok");
                const data = await res.json();
                setStats(data);
                setRaw(data);
                setConnected(true);
            } catch (err) {
                console.error("❌ Failed to fetch stats:", err);
                setConnected(false);
            }
        };

        const fetchTimeseries = async () => {
            try {
                const res = await fetch("http://10.106.87.146:3320/logs/timeseries");
                const data = await res.json();
                setTimeseries(data);
            } catch (err) {
                console.error("❌ Failed to fetch timeseries:", err);
            }
        };

        fetchStats();
        fetchTimeseries();

        const interval = setInterval(() => {
            fetchStats();
            fetchTimeseries();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const renderChart = (label, color, key) => (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md w-full">
            <h3 className="font-semibold mb-2" style={{ color }}>
                {label}
            </h3>
            {timeseries.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={timeseries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis
                            dataKey="time"
                            tick={{ fill: "#aaa", fontSize: 12 }}
                            tickFormatter={(t) =>
                                new Date(t).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                            }
                        />
                        <YAxis stroke="#aaa" />
                        <Tooltip
                            labelFormatter={(t) =>
                                new Date(t).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                            }
                        />
                        <Line
                            type="monotone"
                            dataKey={key}
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            animationDuration={400}
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-gray-400">No data available</p>
            )}
        </div>
    );

    return (
        <div className="p-6 text-white">
            <h1 className="text-2xl font-bold mb-6">📊 Log Analysis</h1>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gray-800 p-6 rounded-lg text-center shadow-md">
                    <h3 className="text-blue-400 font-semibold text-lg">Information Logs</h3>
                    <p className="text-3xl font-bold mt-2">{stats.info}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center shadow-md">
                    <h3 className="text-red-400 font-semibold text-lg">Error Logs</h3>
                    <p className="text-3xl font-bold mt-2">{stats.errors}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center shadow-md">
                    <h3 className="text-yellow-400 font-semibold text-lg">Warning Logs</h3>
                    <p className="text-3xl font-bold mt-2">{stats.warnings}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center shadow-md">
                    <h3 className="text-green-400 font-semibold text-lg">Total Logs</h3>
                    <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
            </div>

            <div className="text-center text-gray-400 mb-6">
                Total logs processed:{" "}
                <strong className="text-white">{stats.total}</strong>
            </div>

            {/* Charts */}
            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="text-red-400 font-semibold mb-2">Error Trend</h3>
                    {timeseries.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={timeseries}>
                                <defs>
                                    <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="errors"
                                    stroke="#ef4444"
                                    fill="url(#errorGradient)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-400 text-sm">No data available</p>
                    )}
                </div>

                <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="text-yellow-400 font-semibold mb-2">Warning Trend</h3>
                    {timeseries.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={timeseries}>
                                <defs>
                                    <linearGradient id="warnGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="warnings"
                                    stroke="#facc15"
                                    fill="url(#warnGradient)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-400 text-sm">No data available</p>
                    )}
                </div>

                <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="text-blue-400 font-semibold mb-2">Info Trend</h3>
                    {timeseries.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={timeseries}>
                                <defs>
                                    <linearGradient id="infoGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="info"
                                    stroke="#3b82f6"
                                    fill="url(#infoGradient)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-400 text-sm">No data available</p>
                    )}
                </div>
            </div>


            {/* Debug Info */}
            <div className="mt-6 bg-gray-900 border border-gray-700 p-4 rounded-lg text-sm text-gray-300">
                <h2 className="text-lg font-semibold mb-2">🧩 Debug Info</h2>
                <p>
                    Status:{" "}
                    {connected ? (
                        <span className="text-green-400">✅ Connected to backend</span>
                    ) : (
                        <span className="text-red-400">❌ Not connected</span>
                    )}
                </p>
                <pre className="bg-black text-green-400 p-2 mt-2 rounded-lg overflow-x-auto">
                    {raw ? JSON.stringify(raw, null, 2) : "Waiting for data..."}
                </pre>
                <p className="mt-2 text-gray-500 text-xs">
                    Last updated: {new Date().toISOString()}
                </p>
            </div>
        </div>
    );
