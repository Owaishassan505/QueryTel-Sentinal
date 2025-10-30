// src/components/LogDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";

import { format, isWithinInterval } from "date-fns";
import {
    LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

// Intelligence modules
//import AIThreatInsights from "./AIThreatInsights";
//import DarkwebMonitor from "./DarkwebMonitor";

/* =============================================================================
   Utility: CSV export
============================================================================= */
function exportToCSV(rows, filename = "logs.csv") {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]);
    const csv =
        [headers.join(",")]
            .concat(
                rows.map((r) =>
                    headers
                        .map((h) => {
                            const val = r[h] ?? "";
                            const escaped = String(val).replaceAll('"', '""');
                            return `"${escaped}"`;
                        })
                        .join(",")
                )
            )
            .join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* =============================================================================
   Utility: PDF export
============================================================================= */
async function exportToPDF(rows, filename = "logs.pdf") {
    if (!rows?.length) return;
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("QueryTel SOC v2 Log Export", 40, 40);

    const headers = Object.keys(rows[0]).map((h) => ({ header: h, dataKey: h }));
    autoTable(doc, {
        startY: 60,
        styles: { fontSize: 8, cellPadding: 3 },
        head: [headers.map((h) => h.header)],
        body: rows.map((r) => headers.map((h) => String(r[h.dataKey] ?? ""))),
    });

    doc.save(filename);
}

/* =============================================================================
   Dark Mode Hook
============================================================================= */
const DARK_KEY = "logdash-dark";
function useDarkMode() {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem(DARK_KEY);
        return saved
            ? saved === "1"
            : window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add("dark");
            localStorage.setItem(DARK_KEY, "1");
        } else {
            root.classList.remove("dark");
            localStorage.setItem(DARK_KEY, "0");
        }
    }, [dark]);

    return [dark, setDark];
}

/* =============================================================================
   Small UI bits
============================================================================= */
function SeverityBadge({ level }) {
    const map = {
        critical: "bg-red-600/15 text-red-300 border-red-600/30",
        error: "bg-red-500/15 text-red-400 border-red-500/30",
        warning: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
        warn: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
        info: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        debug: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    };
    const cls = map[level?.toLowerCase?.()] || map.info;
    return (
        <span className={`px-2 py-1 rounded-full text-xs border ${cls}`}>
            {level || "info"}
        </span>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between border-b border-slate-700/30 py-1 text-sm">
            <span className="opacity-60">{label}</span>
            <span className="text-right break-all">{value || "-"}</span>
        </div>
    );
}

function DateRange({ value, onChange }) {
    const [from, to] = value || ["", ""];
    return (
        <div className="flex gap-2 items-end">
            <label className="text-xs opacity-70">
                From
                <input
                    type="datetime-local"
                    className="block mt-1 input"
                    value={from}
                    onChange={(e) => onChange([e.target.value, to])}
                />
            </label>
            <label className="text-xs opacity-70">
                To
                <input
                    type="datetime-local"
                    className="block mt-1 input"
                    value={to}
                    onChange={(e) => onChange([from, e.target.value])}
                />
            </label>
        </div>
    );
}

/* =============================================================================
   Styles
============================================================================= */
const card =
    "rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur border border-slate-200/30 dark:border-slate-700/50 shadow-sm";
const h2c = "text-slate-800 dark:text-slate-100 text-lg font-semibold";
const inputBase =
    "input px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring focus:ring-blue-500/30";

const PIE_COLORS = ["#38bdf8", "#facc15", "#ef4444", "#94a3b8"];

/* =============================================================================
   Parser: Fortinet key=value message → object
============================================================================= */
function parseKeyVals(rawStr = "") {
    const parsed = {};
    const regex = /(\w+)=(".*?"|\S+)/g;
    let match;
    while ((match = regex.exec(rawStr)) !== null) {
        const key = match[1];
        const val = match[2].replace(/(^"|"$)/g, "");
        parsed[key.toLowerCase()] = val;
    }
    return parsed;
}

/* =============================================================================
   Helpers for Insights
============================================================================= */
function topN(entries, getKey, N = 5) {
    const map = new Map();
    for (const it of entries) {
        const k = getKey(it);
        if (!k) continue;
        map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map, ([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, N);
}

function extractKV(row, key, fallback = "") {
    const raw = row.message || row.event?.message || "";
    const m = raw.match(new RegExp(`${key}="([^"]+)"`)) || raw.match(new RegExp(`${key}=([^\\s"]+)`));
    return (m && m[1]) || row[key] || fallback;
}

/* =============================================================================
   MAIN COMPONENT
============================================================================= */
export default function LogDashboard() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0, info: 0, errors: 0, warnings: 0 });
    const [chartData, setChartData] = useState([]);
    const [dark, setDark] = useDarkMode();
    const [severity, setSeverity] = useState("");
    const [source, setSource] = useState("");
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState(["", ""]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [systemHealth, setSystemHealth] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastSync, setLastSync] = useState(null);
    const [latency, setLatency] = useState(null);
    const [criticalAlert, setCriticalAlert] = useState(null);
    const [bufferedLogs, setBufferedLogs] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [showRawLogsOnHome, setShowRawLogsOnHome] = useState(false);

    const backendURL = "http://10.106.87.146:3320";
    const socketRef = useRef(null);

    /* -------------------------------------------------------------------------
       Auto Health Refresh
    ------------------------------------------------------------------------- */
    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const start = performance.now();
                const res = await fetch(`${backendURL}/api/health`);
                const data = await res.json();
                const end = performance.now();
                setSystemHealth(data);
                setLatency(Math.round(end - start));
                setLastSync(new Date());
            } catch (err) {
                console.error("❌ Health fetch error:", err);
            }
        };
        fetchHealth();
        let interval;
        if (autoRefresh) interval = setInterval(fetchHealth, 15000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    // Merge buffered logs on resume
    useEffect(() => {
        if (autoRefresh && bufferedLogs.length > 0) {
            setLogs((prev) => [...bufferedLogs, ...prev].slice(0, 1000));
            setBufferedLogs([]);
            setPendingCount(0);
        }
    }, [autoRefresh]);
    /* -------------------------------------------------------------------------
       WebSocket + Initial Load
    ------------------------------------------------------------------------- */
    useEffect(() => {
        const s = io(backendURL, { transports: ["websocket"] });
        socketRef.current = s;

        async function loadData() {
            try {
                const [logsRes, statsRes, chartRes] = await Promise.all([
                    fetch(`${backendURL}/logs`).then((r) => r.json()),
                    fetch(`${backendURL}/logs/stats`).then((r) => r.json()),
                    fetch(`${backendURL}/logs/timeseries`).then((r) => r.json()),
                ]);
                setLogs(Array.isArray(logsRes) ? logsRes : (Array.isArray(logsRes.data) ? logsRes.data : []));
                setStats(statsRes);
                setChartData(chartRes);
            } catch (err) {
                console.error("❌ Failed to load data:", err);
            }
        }
        loadData();

        s.on("alert:new", (log) => {
            if (!autoRefresh) {
                setBufferedLogs((prev) => [log, ...prev]);
                setPendingCount((c) => c + 1);
                return;
            }
            setLogs((prev) => [log, ...prev].slice(0, 1000));
        });

        s.on("stats:update", (payload) => {
            setStats(payload);
            const now = new Date().toISOString();
            setChartData((prev) => [
                ...prev,
                { time: now, errors: payload.errors, warnings: payload.warnings },
            ]);
        });

        return () => s.disconnect();
    }, []);

    /* -------------------------------------------------------------------------
       Derived: sources + filtered logs
    ------------------------------------------------------------------------- */
    const sources = useMemo(() => {
        const s = new Set();
        const safeLogs = Array.isArray(logs) ? logs : [];
        safeLogs.forEach((l) => {
            if (l.source?.device) s.add(l.source.device);
            else if (l.source) s.add(l.source);
        });
        return Array.from(s).sort();
    }, [logs]);

    const filtered = useMemo(() => {
        const safeLogs = Array.isArray(logs) ? logs : [];
        return safeLogs.filter((l) => {
            const sev = (l.severity || l.event?.severity || "").toLowerCase();
            const src = l.source?.device || l.source || "";
            if (severity && sev !== severity) return false;
            if (source && src !== source) return false;

            if (dateRange[0] && dateRange[1]) {
                const start = new Date(dateRange[0]);
                const end = new Date(dateRange[1]);
                const t = l.ts ? new Date(l.ts) : l.time ? new Date(l.time) : null;
                if (!t || !isWithinInterval(t, { start, end })) return false;
            }

            if (search) {
                const s = search.toLowerCase();
                const hay = JSON.stringify(l).toLowerCase();
                if (!hay.includes(s)) return false;
            }
            return true;
        });
    }, [logs, severity, source, search, dateRange]);

    /* -------------------------------------------------------------------------
       Insights Computations
    ------------------------------------------------------------------------- */
    const insightBase = Array.isArray(logs) ? logs : [];

    const topDevices = useMemo(() =>
        topN(insightBase, (r) => {
            const dev = extractKV(r, "devname", r.devname);
            const src = extractKV(r, "srcip", r.srcip);
            return dev || src || "";
        }, 5), [insightBase]);

    const topDstCountries = useMemo(() =>
        topN(insightBase, (r) => extractKV(r, "dstcountry", r.dstcountry || "").toUpperCase(), 5),
        [insightBase]);

    const topErrorMessages = useMemo(() => {
        const onlyErrWarn = insightBase.filter((r) => {
            const sev = (r.severity || r.event?.severity || "").toLowerCase();
            return sev === "error" || sev === "warning" || sev === "warn";
        });
        return topN(onlyErrWarn, (r) => {
            const msg = extractKV(r, "msg", r.msg || r.message || "-");
            return msg.length > 80 ? msg.slice(0, 77) + "..." : msg;
        }, 5);
    }, [insightBase]);

    const severityDist = useMemo(() => {
        const counts = { info: 0, warning: 0, error: 0, other: 0 };
        for (const r of insightBase) {
            const sev = (r.severity || r.event?.severity || "").toLowerCase();
            if (sev === "info") counts.info++;
            else if (sev === "warning" || sev === "warn") counts.warning++;
            else if (sev === "error") counts.error++;
            else counts.other++;
        }
        return [
            { name: "Info", value: counts.info },
            { name: "Warning", value: counts.warning },
            { name: "Error", value: counts.error },
            { name: "Other", value: counts.other },
        ];
    }, [insightBase]);

    const criticalAlerts = useMemo(() => {
        const crit = insightBase.filter((r) => {
            const sev = (r.severity || r.event?.severity || "").toLowerCase();
            return sev === "critical";
        });
        return crit.slice(0, 5);
    }, [insightBase]);

    /* -------------------------------------------------------------------------
       UI START
    ------------------------------------------------------------------------- */
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur bg-white/60 dark:bg-slate-950/60 border-b border-slate-200/30 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <h1 className="font-bold text-xl">🧠 QueryTel SOC v2 Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setDark((d) => !d)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900"
                            title="Toggle dark mode">
                            {dark ? "🌙" : "☀️"}
                        </button>
                        <button onClick={() => setAutoRefresh((v) => !v)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm transition ${autoRefresh
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-white"}`}
                            title={autoRefresh ? "Pause live updates" : "Resume auto-refresh"}>
                            {autoRefresh ? "⏸ Pause" : "🔁 Resume"}
                        </button>
                        <button onClick={() => window.location.reload()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm"
                            title="Reload dashboard">🔄 Refresh</button>
                        <button onClick={() => exportToCSV(filtered)} className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700">Export CSV</button>
                        <button onClick={() => exportToPDF(filtered)} className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700">Export PDF</button>
                        <button
                            onClick={() => setShowRawLogsOnHome((v) => !v)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 text-sm"
                            title="Toggle Raw Logs"
                        >
                            {showRawLogsOnHome ? "Hide Raw Logs" : "Show Raw Logs"}
                        </button>

                    </div>
                </div>
            </header>

            {/* Health + Controls */}
            <section className="max-w-7xl mx-auto px-4 mt-4">
                <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl mb-3 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${autoRefresh ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                        <h2 className="text-lg font-semibold">📡 Live Monitor</h2>
                        {lastSync && (
                            <span className="text-sm text-slate-400 ml-2">
                                ⏱ {lastSync.toLocaleTimeString()} | 📡 {latency ?? "..."} ms
                            </span>
                        )}
                    </div>
                </div>

                {systemHealth && (
                    <div className="bg-slate-800 border border-slate-700 text-sm text-slate-300 rounded-md p-2 mb-6 text-center">
                        <span className={systemHealth.status === "Healthy" ? "text-green-400" : "text-red-400"}>
                            ● {systemHealth.status}
                        </span>{" "}
                        | Uptime: {systemHealth.uptime}s | Load: {systemHealth.load} | Mem: {systemHealth.memoryMB} MB | Alerts: {systemHealth.activeAlerts}
                    </div>
                )}
            </section>

            {/* === MAIN === */}
            <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                {/* 📊 Insights & Trends Section */}
                <section className={`${card} p-5`}>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className={h2c}>🧠 Insights & Trends</h2>
                        <small className="opacity-60">Based on {insightBase.length} logs</small>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
                        {/* Pie: Severity */}
                        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                            <h3 className="text-sm opacity-70 mb-2">Severity Distribution</h3>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={severityDist} innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                                            {severityDist.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>

                                        <Legend />
                                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "10px", color: "#f8fafc" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bar: Devices */}
                        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                            <h3 className="text-sm opacity-70 mb-2">Most Attacked Devices</h3>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topDevices}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "10px", color: "#f8fafc" }} />
                                        <Bar dataKey="count" fill="#38bdf8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* List: Countries */}
                        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                            <h3 className="text-sm opacity-70 mb-2">Top Destination Countries</h3>
                            <ul className="space-y-2">
                                {topDstCountries.map((c) => (
                                    <li key={c.name} className="flex justify-between text-sm">
                                        <span>{c.name}</span>
                                        <span className="font-semibold text-slate-200">{c.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* 2nd Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 xl:col-span-2">
                            <h3 className="text-sm opacity-70 mb-2">Top Error/Warning Messages</h3>
                            <ul className="space-y-2">
                                {topErrorMessages.map((e, i) => (
                                    <li key={i} className="flex justify-between text-sm">
                                        <span className="truncate pr-4 text-slate-300">{e.name}</span>
                                        <span className="text-red-300 font-semibold">{e.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                            <h3 className="text-sm opacity-70 mb-2">Active Critical Alerts</h3>
                            <ul className="space-y-2">
                                {criticalAlerts.map((r, i) => {
                                    const ts = r.timestamp || r.eventtime || r.ts || r.time;
                                    const when = ts ? new Date(ts).toLocaleTimeString() : "-";
                                    const msg = extractKV(r, "msg", r.msg || r.message || "-");
                                    return (
                                        <li key={i} className="text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-red-400 font-medium">{when}</span>
                                                <span className="opacity-60">{extractKV(r, "devname", r.devname || "")}</span>
                                            </div>
                                            <div className="truncate text-slate-300">{msg}</div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Buffered Logs Notification */}
                {!autoRefresh && pendingCount > 0 && (
                    <div className="bg-amber-700/40 border border-amber-500 text-center py-2 mb-3 rounded-md text-amber-200 font-medium animate-pulse">
                        ⚠️ {pendingCount} new logs captured while paused.
                        <button
                            onClick={() => {
                                setLogs((prev) => [...bufferedLogs, ...prev].slice(0, 1000));
                                setBufferedLogs([]); setPendingCount(0);
                            }}
                            className="ml-3 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm">
                            Apply Updates
                        </button>
                    </div>
                )}

                {/* Raw Logs Table (optional toggle) */}
                {showRawLogsOnHome && (
                    <section className={`${card} p-5 transition-all duration-500 animate-fadeIn`}>
                        <div className="flex justify-between items-center mb-3">
                            <h2 className={h2c}>🧾 Live Raw Logs (Compact View)</h2>
                            <span className="text-xs opacity-60">
                                Showing latest {Math.min(filtered.length, 15)} logs
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                            <table className="w-full text-sm text-slate-200">
                                <thead className="bg-slate-800/80 text-slate-300 uppercase text-xs">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Time</th>
                                        <th className="px-3 py-2 text-left">Severity</th>
                                        <th className="px-3 py-2 text-left">Device</th>
                                        <th className="px-3 py-2 text-left">Source</th>
                                        <th className="px-3 py-2 text-left">Destination</th>
                                        <th className="px-3 py-2 text-left">Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.slice(0, 15).map((r, i) => {
                                        const sev = (r.severity || r.event?.severity || "info").toLowerCase();
                                        const sevColor =
                                            sev === "error"
                                                ? "text-red-400"
                                                : sev === "warning" || sev === "warn"
                                                    ? "text-yellow-400"
                                                    : sev === "critical"
                                                        ? "text-red-500 font-semibold"
                                                        : "text-blue-400";

                                        const ts =
                                            r.timestamp || r.eventtime || r.ts || r.time
                                                ? new Date(r.timestamp || r.eventtime || r.ts || r.time).toLocaleTimeString()
                                                : "-";

                                        const msg =
                                            (r.msg ||
                                                r.message ||
                                                (r.event && r.event.message) ||
                                                "").slice(0, 60) + (r.message?.length > 60 ? "..." : "");

                                        const dev = r.devname || extractKV(r, "devname", "-");
                                        const src = extractKV(r, "srcip", "-");
                                        const dst = extractKV(r, "dstip", "-");

                                        return (
                                            <tr
                                                key={i}
                                                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                                            >
                                                <td className="px-3 py-2 whitespace-nowrap">{ts}</td>
                                                <td className={`px-3 py-2 font-medium ${sevColor}`}>{sev}</td>
                                                <td className="px-3 py-2">{dev}</td>
                                                <td className="px-3 py-2">{src}</td>
                                                <td className="px-3 py-2">{dst}</td>
                                                <td className="px-3 py-2 truncate max-w-[300px]" title={msg}>
                                                    {msg}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}



            </main>
        </div>
    );
}
