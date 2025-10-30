import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function LogDashboard() {
    const [stats, setStats] = useState({ info: 0, errors: 0, warnings: 0, total: 0 });
    const [timeseries, setTimeseries] = useState([]);
    const [logs, setLogs] = useState([]);
    const [severityFilter, setSeverityFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");



    useEffect(() => {
        const fetchAll = async () => {
            const start = performance.now();

            const [statsRes, timeseriesRes, logsRes, healthRes] = await Promise.all([
                fetch("http://10.106.87.146:3320/logs/stats"),
                fetch("http://10.106.87.146:3320/logs/timeseries"),
                fetch("http://10.106.87.146:3320/logs"),
                fetch("http://10.106.87.146:3320/api/health"),
            ]);

            const [statsData, timeseriesData, logsData, healthData] = await Promise.all([
                statsRes.json(),
                timeseriesRes.json(),
                logsRes.json(),
                healthRes.json(),
            ]);

            setStats(statsData);
            setTimeseries(timeseriesData);
            setLogs(logsData.logs || logsData);
            setSystemHealth(healthData);

            const end = performance.now();
            setLatency(Math.round(end - start));
            setLastSync(new Date());
        };

        fetchAll(); // initial load

        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchAll, 15000); // 15 s refresh
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);


    const filteredLogs = logs.filter((log) => {
        const matchSeverity =
            severityFilter === "All" || log.severity?.toLowerCase() === severityFilter.toLowerCase();
        const matchSearch = log.message?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchSeverity && matchSearch;
    });

    const renderChart = (label, color, key) => (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md w-full">
            <h3 className="font-semibold mb-2" style={{ color }}>
                {label}
            </h3>
            {timeseries.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={timeseries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis
                            dataKey="time"
                            tick={{ fill: "#aaa", fontSize: 12 }}
                            tickFormatter={(t) =>
                                new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                            }
                        />
                        <YAxis stroke="#aaa" />
                        <Tooltip />
                        <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-gray-400">No data available</p>
            )}
        </div>
    );

    return (
        <div className="p-6 text-white">
            <h1 className="text-2xl font-bold mb-6">📊 QueryTel SOC Dashboard</h1>

            {/* Summary Cards */}
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

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {renderChart("Error Trend", "#ef4444", "errors")}
                {renderChart("Warning Trend", "#facc15", "warnings")}
                {renderChart("Info Trend", "#3b82f6", "info")}
            </div>

            {/* Filters Section */}
            <div className="bg-gray-900 p-4 rounded-lg mb-4 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3">🔍 Filters & Search</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                        className="bg-gray-800 text-white p-2 rounded-md"
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                    >
                        <option>All</option>
                        <option>Error</option>
                        <option>Warning</option>
                        <option>Info</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="bg-gray-800 text-white p-2 rounded-md"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            setSeverityFilter("All");
                            setSearchQuery("");
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Recent Logs */}
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold mb-3">🕒 Recent Logs</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-gray-300">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                                <th className="p-2 text-left">Time</th>
                                <th className="p-2 text-left">Severity</th>
                                <th className="p-2 text-left">Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.slice(0, 20).map((log, i) => (
                                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="p-2">{new Date(log.ts).toLocaleString()}</td>
                                    <td className="p-2">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${log.severity === "error"
                                                ? "bg-red-500/20 text-red-400"
                                                : log.severity === "warning"
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-blue-500/20 text-blue-400"
                                                }`}
                                        >
                                            {log.severity}
                                        </span>
                                    </td>
                                    <td className="p-2 whitespace-nowrap">{log.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
import AIThreatInsights from "./AIThreatInsights";

// Inside JSX:
<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
    <AIThreatInsights />
    {/* Other components */}
</div>
