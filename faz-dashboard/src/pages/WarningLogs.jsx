import React, { useState, useEffect } from "react";
import { apiFetch } from "../api/api";
import LogTable from "../components/tables/LogTable";

export default function WarningLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [category, setCategory] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // -------------------------
    // LOAD FILTERED LOGS
    // -------------------------
    const loadFiltered = async () => {
        setLoading(true);

        const body = {
            category,
            startDate: startDate || null,
            endDate: endDate || null,
        };

        const response = await apiFetch("/api/logs/warning/filter", "POST", body);

        if (response.ok && response.data?.logs) {
            setLogs(response.data.logs);
        } else {
            console.error("Filter failed → fallback to GET");
            loadLogs(); // fallback
        }

        setLoading(false);
    };

    // -------------------------
    // LOAD ALL LOGS (GET)
    // -------------------------
    const loadLogs = async () => {
        setLoading(true);

        const { ok, data } = await apiFetch("/api/logs/warning");

        if (!ok || !Array.isArray(data)) {
            setLogs([]);
        } else {
            setLogs(data);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadLogs();
    }, []);

    // -------------------------
    // EXPORT CSV
    // -------------------------
    const exportCSV = () => {
        const header = "Timestamp,Severity,Device,Source,Destination,Message\n";

        const rows = logs.map(log =>
            `${new Date(log.ts).toLocaleString()},${log.severity},${log.deviceName || "-"},${log.sourceIp || "-"},${log.destIp || "-"},"${log.message?.replace(/"/g, "'") || "-"}"`
        );

        const csv = header + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "warning_logs.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // -------------------------
    // UI
    // -------------------------
    return (
        <div className="space-y-6">

            {/* HEADER BAR */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-100">Warning Logs</h1>

                <div className="flex gap-3">
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                        onClick={exportCSV}
                    >
                        Export CSV
                    </button>

                    <button
                        className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/80"
                        onClick={loadLogs}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="flex items-center gap-4 bg-black/20 p-4 rounded-lg border border-gray-700">

                {/* CATEGORY FILTER */}
                <select
                    className="bg-black/40 border border-gray-600 text-gray-100 px-3 py-2 rounded-md"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    <option value="SSL">SSL</option>
                    <option value="VPN">VPN</option>
                    <option value="IPS">IPS</option>
                    <option value="Web Filter">Web Filter</option>
                    <option value="Application Control">Application Control</option>
                    <option value="Failed Login">Failed Login</option>
                    <option value="DNS">DNS</option>
                </select>

                {/* DATE FILTERS */}
                <input
                    type="date"
                    className="bg-black/40 border border-gray-600 text-gray-100 px-3 py-2 rounded-md"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />

                <input
                    type="date"
                    className="bg-black/40 border border-gray-600 text-gray-100 px-3 py-2 rounded-md"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />

                {/* FILTER BUTTON */}
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                    onClick={loadFiltered}
                >
                    Apply Filters
                </button>
            </div>

            {/* LOG TABLE */}
            {loading ? (
                <div className="text-gray-300 text-center py-10">Loading logs...</div>
            ) : (
                <LogTable logs={logs} />
            )}
        </div>
    );
}
