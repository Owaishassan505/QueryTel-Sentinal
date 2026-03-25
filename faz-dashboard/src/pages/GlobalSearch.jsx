import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../api/api";
import LogTable from "../components/Logs/LogTable";
import { Search, RotateCw, ShieldCheck, Activity, Filter, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function GlobalSearch() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get("q") || "";

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [severity, setSeverity] = useState("all");

    const fetchSearchResults = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const url = `/api/logs/search?q=${encodeURIComponent(query)}&page=${page}&severity=${severity}&limit=50`;
            const { ok, data } = await apiFetch(url);
            if (ok) {
                setLogs(data.logs || []);
                setTotal(data.total || 0);
            }
        } catch (err) {
            console.error("Search fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1); // Reset page on new query or severity change
        fetchSearchResults();
    }, [query, severity]);

    useEffect(() => {
        fetchSearchResults();
    }, [page]);

    const totalPages = Math.ceil(total / 50);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 italic uppercase">
                        <Search className="w-6 h-6 text-blue-500" />
                        Search Results
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Global query: <span className="text-blue-500">"{query}"</span> — Found {total} records
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-2 gap-2">
                        <Filter className="w-3.5 h-3.5 text-slate-500" />
                        <select
                            className="bg-transparent text-slate-300 text-xs font-bold outline-none cursor-pointer"
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                        >
                            <option value="all" className="bg-[#0f172a]">All Severities</option>
                            <option value="emergency" className="bg-[#0f172a]">Emergency</option>
                            <option value="alert" className="bg-[#0f172a]">Alert</option>
                            <option value="critical" className="bg-[#0f172a]">Critical</option>
                            <option value="error" className="bg-[#0f172a]">Error</option>
                            <option value="warning" className="bg-[#0f172a]">Warning</option>
                            <option value="info" className="bg-[#0f172a]">Information</option>
                        </select>
                    </div>
                    <button
                        className="p-2 bg-[#0f172a] border border-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors"
                        onClick={fetchSearchResults}
                    >
                        <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl relative">
                {loading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0c10]/60 backdrop-blur-sm">
                        <Activity className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Scanning Database Matrix...</p>
                    </div>
                )}

                <LogTable logs={logs} />
            </div>

            {/* Manual Pagination if LogTable internal pagination isn't enough for server-side */}
            <div className="flex items-center justify-between px-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                    Database Page {page} of {totalPages || 1}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="p-2 rounded-xl bg-[#0f172a] border border-slate-800 text-slate-400 disabled:opacity-20 hover:text-blue-500 transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 hover:bg-blue-500 transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
