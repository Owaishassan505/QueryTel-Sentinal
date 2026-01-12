import React, { useEffect, useState } from "react";
import { FileDown, RefreshCw, AlertTriangle, ShieldAlert } from "lucide-react";
import axios from "axios";

export default function AIThreatInsights() {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/threat-insights"); // Backend endpoint
            setInsights(res.data || []);
        } catch (err) {
            setError("Failed to load AI Threat Insights.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const exportToCSV = () => {
        const headers = ["Timestamp", "Type", "Severity", "Description"];
        const rows = insights.map(i => [i.timestamp, i.type, i.severity, i.description]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = "AI_Threat_Insights.csv";
        link.click();
    };

    const severityColor = (severity) => {
        switch (severity) {
            case "Critical": return "text-red-500 font-bold";
            case "High": return "text-orange-500 font-semibold";
            case "Medium": return "text-yellow-500 font-semibold";
            case "Low": return "text-green-500 font-semibold";
            default: return "";
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4 items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-red-500" />
                    AI Threat Insights
                </h2>

                <div className="flex gap-3">
                    <button
                        onClick={fetchInsights}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>

                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2"
                    >
                        <FileDown className="h-4 w-4" /> Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-lg animate-pulse">Loading AI analysis...</div>
            ) : error ? (
                <div className="text-red-500 text-center py-10">{error}</div>
            ) : insights.length === 0 ? (
                <div className="text-gray-500 text-center py-10">No Current Threat Insights</div>
            ) : (
                <div className="space-y-4">
                    {insights.map((item, idx) => (
                        <div key={idx} className="border border-gray-300 bg-white shadow-md p-5 rounded-xl">
                            <div className="flex justify-between mb-2">
                                <span className="font-semibold">{item.type}</span>
                                <span className={severityColor(item.severity)}>
                                    {item.severity}
                                </span>
                            </div>

                            <p className="text-gray-700 leading-relaxed">{item.description}</p>

                            <p className="text-sm text-gray-400 mt-2">
                                {item.timestamp}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
