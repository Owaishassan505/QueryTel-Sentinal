// src/components/tables/LogsTableV2.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
    ChevronDownIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function LogsTableV2({
    logs = [],
    categoryFilter = null,
    countryFilter = null
}) {

    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 20;

    // Refresh event
    useEffect(() => {
        const handleRefresh = () => {
            setCurrentPage(1); // Stay on page 1 on refresh
        };
        window.addEventListener("refreshLogs", handleRefresh);
        return () => window.removeEventListener("refreshLogs", handleRefresh);
    }, []);


    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Extract readable message
    const extractReadable = (raw = "") => {
        if (!raw) return "-";
        const msgMatch = raw.match(/msg="([^"]+)"/);
        if (msgMatch) return msgMatch[1];
        return raw.replace(/\"/g, "").split(" ")[0];
    };


    // Apply Filters
    const filteredLogs = useMemo(() => {
        let data = Array.isArray(logs) ? logs : [];

        if (countryFilter && countryFilter !== "all") {
            data = data.filter((l) => {
                const c = l.country || l.geoip?.country || "-";
                return c === countryFilter;
            });
        }

        if (categoryFilter && categoryFilter !== "all") {
            data = data.filter((l) => {
                const cat = l.category || l.log_type || "";
                return cat.toLowerCase() === categoryFilter.toLowerCase();
            });
        }

        if (severityFilter !== "all") {
            data = data.filter(
                (l) => (l.severity || "").toLowerCase() === severityFilter
            );
        }

        if (search.trim()) {
            const s = search.toLowerCase();
            data = data.filter((l) => {
                const device = l.deviceName?.toLowerCase() || "";
                const src = l.sourceIp?.toLowerCase() || l.source_ip?.toLowerCase() || "";
                const dst = l.destIp?.toLowerCase() || l.dest_ip?.toLowerCase() || "";
                const msg = l.message?.toLowerCase() || "";
                const raw = l.raw?.toLowerCase() || "";
                const human = l.humanMessage?.toLowerCase() || "";

                return (
                    device.includes(s) ||
                    src.includes(s) ||
                    dst.includes(s) ||
                    msg.includes(s) ||
                    raw.includes(s) ||
                    human.includes(s)
                );
            });
        }


        return data;
    }, [logs, search, severityFilter, categoryFilter, countryFilter]);


    // Pagination logic
    const indexOfLast = currentPage * logsPerPage;
    const indexOfFirst = indexOfLast - logsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };


    const badgeClass = (sev) => {
        const s = (sev || "").toLowerCase();
        if (s === "critical") return "bg-red-600 text-white";
        if (s === "error") return "bg-red-500 text-white";
        if (s === "warning") return "bg-yellow-500 text-black";
        if (s === "info") return "bg-blue-500 text-white";
        return "bg-gray-500 text-white";
    };

    const formatTime = (ts) => {
        try {
            return new Date(ts).toLocaleString();
        } catch {
            return ts;
        }
    };


    return (
        <div className="bg-panel p-4 rounded-xl border border-borderColor shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-primary">Log Explorer</h2>
                <p className="text-gray-400 text-xs">
                    Showing {filteredLogs.length} events
                </p>
            </div>

            {/* SEARCH + FILTER */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
                    <input
                        className="bg-black/30 border border-borderColor text-gray-100 text-sm rounded-md pl-8 pr-2 py-2 w-full"
                        placeholder="Search logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-black/40 border border-borderColor text-gray-100 text-sm rounded-md px-2 py-2"
                >
                    <option value="all">All</option>
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                </select>
            </div>

            {/* LOG LIST (NO SCROLLBAR) */}
            <div className="border border-borderColor rounded-lg">
                {currentLogs.map((log, idx) => {
                    const absoluteIndex = indexOfFirst + idx;
                    const isExpanded = expandedIndex === absoluteIndex;

                    return (
                        <div key={absoluteIndex} className="border-b border-borderColor/40 text-sm">
                            <div
                                className="flex items-center p-2 hover:bg-black/20 cursor-pointer"
                                onClick={() =>
                                    setExpandedIndex(isExpanded ? null : absoluteIndex)
                                }
                            >
                                <div className="mr-3 text-gray-400">
                                    {isExpanded ? (
                                        <ChevronDownIcon className="w-4 h-4" />
                                    ) : (
                                        <ChevronRightIcon className="w-4 h-4" />
                                    )}
                                </div>

                                <div className="w-44 text-gray-300">{formatTime(log.ts)}</div>

                                <div className="w-24">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass(
                                            log.severity
                                        )}`}
                                    >
                                        {(log.severity || "INFO").toUpperCase()}
                                    </span>
                                </div>

                                <div
                                    className="flex-1 text-gray-100 truncate"
                                    title={log.humanMessage || log.message}
                                >
                                    <span className={log.riskLevel === 'CRITICAL' ? 'text-red-400 font-semibold' : ''}>
                                        {log.humanMessage || log.message || "System Log"}
                                    </span>
                                    {log.count > 1 && (
                                        <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-gray-400 border border-white/5">
                                            x{log.count.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                <div className="w-40 text-gray-300">{log.deviceName || "-"}</div>
                                <div className="w-32 text-gray-300">
                                    {log.sourceIp || log.source_ip || "-"}
                                </div>
                                <div className="w-32 text-gray-300 text-right">
                                    {log.destIp || log.dest_ip || "-"}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="bg-black/40 p-4 text-xs text-gray-300 border-t border-borderColor/20">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-semibold text-primary mb-1 uppercase tracking-wider text-[10px]">
                                                Intelligence Context
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                                                    Risk: {log.riskLevel || 'Low'}
                                                </span>
                                                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                                                    Category: {log.category || 'General'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-gray-500 uppercase text-[10px]">First Seen</div>
                                            <div>{formatTime(log.firstSeen || log.ts)}</div>
                                        </div>
                                    </div>

                                    <div className="font-semibold text-primary mb-1 uppercase tracking-wider text-[10px]">
                                        Raw Telemetry (Drill-down)
                                    </div>
                                    <pre className="bg-black/60 p-3 rounded-lg border border-borderColor/30 overflow-auto max-h-64 text-[11px] font-mono whitespace-pre-wrap text-emerald-400/80">
                                        {JSON.stringify(log.parsed || log, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-4">
                <button
                    disabled={currentPage === 1}
                    onClick={prevPage}
                    className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-40"
                >
                    ◀ Prev
                </button>

                <span className="text-gray-300 text-sm">
                    Page {currentPage} / {totalPages}
                </span>

                <button
                    disabled={currentPage === totalPages}
                    onClick={nextPage}
                    className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-40"
                >
                    Next ▶
                </button>
            </div>
        </div>
    );
}
