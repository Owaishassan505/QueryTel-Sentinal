import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { SlidersHorizontal } from "lucide-react";

export default function Analysis() {
    const [summary, setSummary] = useState("Loading AI analysis...");
    const [timeline, setTimeline] = useState([]);
    const [filters, setFilters] = useState({});
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    const authHeader = {
        headers: { Authorization: `Bearer ${token}` }
    };

    // Fetch AI Summary
    const fetchSummary = async () => {
        try {
            const res = await axios.get("/api/analysis/summary", authHeader);
            setSummary(res.data.summary || "No summary.");
        } catch (err) {
            console.error("AI Summary Error:", err);
            setSummary("Failed to load summary.");
        }
    };

    // Fetch timeline
    const fetchTimeline = async () => {
        try {
            const res = await axios.get("/logs/timeseries", authHeader);

            // Ensure it's an array
            if (Array.isArray(res.data)) {
                // Map to recharts-compatible format
                const parsed = res.data.map(item => ({
                    ts: item.time || item.time || "",
                    errors: item.errors || 0,
                    warnings: item.warnings || 0,
                    info: item.info || 0
                }));
                setTimeline(parsed);
            } else {
                console.error("Timeline is NOT array:", res.data);
                setTimeline([]);
            }

        } catch (err) {
            console.error("Timeline Error:", err);
            setTimeline([]);
        }
    };

    // Apply filters
    const applyFilters = async () => {
        setLoading(true);
        try {
            const res = await axios.post("/api/analysis/filter", filters, authHeader);
            setResults(res.data.results || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchTimeline();
    }, []);

    return (
        <div className="p-6 space-y-8">
            {/* AI SUMMARY */}
            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-700">
                <h2 className="text-xl font-bold mb-2 text-white">AI Investigation Summary</h2>
                <p className="text-gray-300 whitespace-pre-line">{summary}</p>
            </div>

            {/* TIMELINE */}
            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-700">
                <h2 className="text-xl font-bold mb-4 text-white">Threat Timeline</h2>
                <div className="h-64">
                    <ResponsiveContainer>
                        <LineChart data={timeline}>
                            <XAxis dataKey="ts" tick={{ fill: "#aaa" }} />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="errors" stroke="#ff4444" strokeWidth={2} />
                            <Line type="monotone" dataKey="warnings" stroke="#ffbb33" strokeWidth={2} />
                            <Line type="monotone" dataKey="info" stroke="#33b5e5" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* FILTER PANEL */}
            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-700">
                <h2 className="text-xl font-bold mb-4 text-white flex items-center">
                    <SlidersHorizontal className="mr-2" /> Deep Search Filters
                </h2>

                <div className="grid grid-cols-3 gap-4">
                    <input placeholder="Severity" className="p-2 bg-gray-800 rounded text-white"
                        onChange={(e) => setFilters({ ...filters, severity: e.target.value })} />

                    <input placeholder="Category" className="p-2 bg-gray-800 rounded text-white"
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })} />

                    <input placeholder="Device" className="p-2 bg-gray-800 rounded text-white"
                        onChange={(e) => setFilters({ ...filters, device: e.target.value })} />

                    <input placeholder="Source Country" className="p-2 bg-gray-800 rounded text-white"
                        onChange={(e) => setFilters({ ...filters, srcCountry: e.target.value })} />

                    <input placeholder="Destination Country" className="p-2 bg-gray-800 rounded text-white"
                        onChange={(e) => setFilters({ ...filters, dstCountry: e.target.value })} />

                    <input type="datetime-local" className="p-2 bg-gray-800 rounded text-white"
                        onChange={(e) => setFilters({ ...filters, start: e.target.value })} />

                    <input type="datetime-local" className="p-2 bg-gray-800 rounded text-white"
                        onChange={(e) => setFilters({ ...filters, end: e.target.value })} />
                </div>

                <button onClick={applyFilters}
                    className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                    Apply Filters
                </button>
            </div>

            {/* RESULTS */}
            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-700">
                <h2 className="text-xl font-bold mb-4 text-white">Filter Results</h2>

                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : (
                    <div className="space-y-2">
                        {results.map((log, idx) => (
                            <div key={idx}
                                className="p-3 bg-gray-800 rounded-lg text-gray-300 border border-gray-700">
                                <div className="flex justify-between">
                                    <span>{log.ts}</span>
                                    <span className="px-2 py-1 rounded bg-gray-700">{log.severity}</span>
                                </div>
                                <p className="mt-1">{log.message}</p>
                                <p className="text-sm text-gray-500">
                                    {log.deviceName} → {log.sourceIp} → {log.destIp}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
