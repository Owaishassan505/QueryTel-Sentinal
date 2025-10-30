import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AIThreatInsights() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState("");
    const [chartData, setChartData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await fetch("http://10.106.87.146:3320/api/ai/threat-insights");
                const data = await res.json();
                setSummary(data.summary || "No summary available.");
                setChartData(data.chartData || []);
            } catch (err) {
                console.error("❌ Failed to load AI Threat Insights:", err);
                setError("Failed to load AI Threat Insights.");
            } finally {
                setLoading(false);
            }
        };

        fetchInsights(); // ✅ runs only once
    }, []); // <-- prevents infinite re-render loop

    if (loading)
        return <div className="text-center mt-10 text-gray-400">Loading AI Insights...</div>;
    if (error)
        return <div className="text-center mt-10 text-red-400">{error}</div>;

    return (
        <div className="p-6 space-y-6 text-white">
            <div className="shadow-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        🤖 AI Threat Insights
                    </h2>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                    >
                        Refresh
                    </button>
                </div>

                {/* AI Summary */}
                <div className="border-t border-slate-700 mt-3 pt-3 text-gray-300">
                    <p>{summary}</p>
                </div>
            </div>

            {/* Chart Section */}
            <div className="shadow-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-5">
                <h2 className="text-lg font-semibold mb-4 text-cyan-300">Threat Categories</h2>
                <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <XAxis dataKey="category" stroke="#aaa" />
                            <YAxis stroke="#aaa" />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                            />
                            <Bar dataKey="count" fill="#06b6d4" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
