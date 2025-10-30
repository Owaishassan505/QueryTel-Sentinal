import React, { useEffect, useState } from "react";
import { RefreshCw, PauseCircle, PlayCircle } from "lucide-react";

export default function TopBar({
    onRefresh,                // async fn to refresh logs + stats
    onExportCSV,              // handler you already have
    onExportPDF,              // handler you already have
    title = "QueryTel SOC v2 Dashboard"
}) {
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastSync, setLastSync] = useState(null);
    const [latencyMs, setLatencyMs] = useState(null);

    const handleRefresh = async () => {
        const start = performance.now();
        await onRefresh?.();
        const end = performance.now();
        setLastSync(new Date());
        setLatencyMs(Math.round(end - start));
    };

    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(() => {
            handleRefresh();
        }, 15000); // 15s
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoRefresh]);

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-[#0B1220] rounded-xl border border-slate-800 shadow-md">
            {/* Left: Title + live dot */}
            <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-semibold text-white">{title}</h1>
                <span
                    className={`inline-block w-3 h-3 rounded-full ${autoRefresh ? "bg-green-400 animate-pulse" : "bg-gray-500"
                        }`}
                    title={autoRefresh ? "Live updates ON" : "Paused"}
                />
                <div className="text-[11px] md:text-xs text-slate-400 ml-2">
                    {lastSync ? (
                        <>
                            ⏱ Last Sync: {lastSync.toLocaleTimeString()} • 📡 {latencyMs ?? "…"} ms
                        </>
                    ) : (
                        "Waiting for first sync…"
                    )}
                </div>
            </div>

            {/* Right: controls + your existing Export buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition"
                    title="Manual refresh"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>

                <button
                    onClick={() => setAutoRefresh((s) => !s)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${autoRefresh
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-slate-700 hover:bg-slate-600 text-white"
                        }`}
                    title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
                >
                    {autoRefresh ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                    {autoRefresh ? "Pause" : "Resume"}
                </button>

                <button
                    onClick={onExportCSV}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm"
                >
                    Export CSV
                </button>

                <button
                    onClick={onExportPDF}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm"
                >
                    Export PDF
                </button>
            </div>
        </div>
    );
}
