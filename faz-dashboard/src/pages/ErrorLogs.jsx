import React, { useState, useEffect } from "react";
import { apiFetch } from "../api/api";
import LogTable from "../components/tables/LogTable";

export default function ErrorLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const loadLogs = async () => {
        setLoading(true);

        // CORRECT ENDPOINT
        const { ok, data } = await apiFetch("/api/logs/error");

        if (!ok || !Array.isArray(data)) {
            console.error("Failed to fetch error logs");
            setLogs([]);
        } else {
            setLogs(data);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadLogs();
    }, []);

    // 🔍 Client-side filtered logs
    const filteredLogs = logs.filter((l) => {
        const s = search.toLowerCase();

        return (
            (l.deviceName || "").toLowerCase().includes(s) ||
            (l.sourceIp || l.source_ip || "").toLowerCase().includes(s) ||
            (l.destIp || l.dest_ip || "").toLowerCase().includes(s) ||
            (l.message || "").toLowerCase().includes(s) ||
            (l.raw || "").toLowerCase().includes(s)
        );
    });

    return (
        <div className="space-y-4">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-100">Error Logs</h1>

                <button
                    className="px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary/80"
                    onClick={loadLogs}
                >
                    Refresh
                </button>
            </div>

            {/* 🔍 SEARCH BAR */}
            <div className="flex mb-3">
                <input
                    type="text"
                    placeholder="Search logs..."
                    className="px-3 py-2 w-72 bg-black/40 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-primary outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* TABLE */}
            {loading ? (
                <div className="text-gray-300 text-center py-10">Loading logs...</div>
            ) : (
                <LogTable logs={filteredLogs} />
            )}
        </div>
    );
}
