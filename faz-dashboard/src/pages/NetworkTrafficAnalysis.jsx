import React, { useState, useEffect, useCallback } from "react";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import {
    Network, Activity, Globe, Server, Filter,
    Calendar, RotateCw, FileText, Printer,
    ShieldAlert, Wifi, Layers, TrendingUp, MapPin,
    ShieldCheck, AlertCircle, ChevronDown, ChevronUp, ArrowUpRight, Zap
} from "lucide-react";
import { backendURL } from "../config";

// ─── Colour helpers ──────────────────────────────────────────
const PROTOCOL_COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
    "#a3e635", "#e879f9", "#34d399", "#fb923c"
];

const riskColor = (level) => {
    switch (level) {
        case "CRITICAL": return "text-red-400 bg-red-500/10 border-red-500/30";
        case "HIGH":     return "text-orange-400 bg-orange-500/10 border-orange-500/30";
        case "MEDIUM":   return "text-amber-400 bg-amber-500/10 border-amber-500/30";
        default:         return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    }
};

// ─── Sub-components ───────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = "blue" }) => (
    <div className={`bg-[#0f172a]/60 backdrop-blur-md border border-${color}-500/10 rounded-2xl p-5 flex items-start gap-4 group hover:border-${color}-500/30 transition-all`}>
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-white font-mono leading-none">{typeof value === "number" ? value.toLocaleString() : value}</p>
            {sub && <p className="text-[10px] text-slate-500 mt-1 font-mono">{sub}</p>}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-[11px]">
            <p className="text-slate-400 font-bold mb-2 uppercase tracking-widest">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-black">
                    {p.name}: {p.value.toLocaleString()}
                </p>
            ))}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────
export default function NetworkTrafficAnalysis() {
    const [overview, setOverview]   = useState({ totalSessions: 0, uniqueSrcIPs: 0, uniqueDstIPs: 0, topCategory: "—" });
    const [timeline, setTimeline]   = useState([]);
    const [protocols, setProtocols] = useState([]);
    const [talkers, setTalkers]     = useState([]);
    const [geoData, setGeoData]     = useState([]);
    const [analysis, setAnalysis]   = useState({ summary: "Monitoring network baseline...", riskLevel: "LOW", anomalies: [] });
    const [loading, setLoading]     = useState(true);
    const [expandedIp, setExpandedIp] = useState(null);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate,   setEndDate]   = useState("");
    const [category,  setCategory]  = useState("all");
    const [srcCountry, setSrcCountry] = useState("");

    const buildParams = () => {
        const p = new URLSearchParams();
        if (startDate)           p.append("startDate", startDate);
        if (endDate)             p.append("endDate", endDate);
        if (category !== "all")  p.append("category", category);
        if (srcCountry.trim())   p.append("srcCountry", srcCountry.trim());
        return p.toString() ? `?${p.toString()}` : "";
    };

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const qs = buildParams();
        try {
            const [ovRes, tlRes, prRes, tkRes, geoRes, intlRes] = await Promise.all([
                fetch(`${backendURL}/api/network/overview${qs}`, { headers }),
                fetch(`${backendURL}/api/network/traffic-timeline${qs}`, { headers }),
                fetch(`${backendURL}/api/network/protocol-breakdown${qs}`, { headers }),
                fetch(`${backendURL}/api/network/top-talkers${qs}`, { headers }),
                fetch(`${backendURL}/api/network/geo-sessions${qs}`, { headers }),
                fetch(`${backendURL}/api/network/intelligence${qs}`, { headers }),
            ]);

            const safeJson = async (r) => {
                try { return r.ok ? await r.json() : null; }
                catch { return null; }
            };

            const [ov, tl, pr, tk, geo, intl] = await Promise.all([
                safeJson(ovRes), safeJson(tlRes), safeJson(prRes),
                safeJson(tkRes), safeJson(geoRes), safeJson(intlRes),
            ]);

            if (ov)   setOverview(ov);
            if (tl)   setTimeline(Array.isArray(tl) ? tl : []);
            if (pr)   setProtocols(Array.isArray(pr) ? pr : []);
            if (tk)   setTalkers(Array.isArray(tk) ? tk : []);
            if (geo)  setGeoData(Array.isArray(geo) ? geo : []);
            if (intl) setAnalysis(intl);
        } catch (err) {
            console.error("Network Traffic fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, category, srcCountry]);

    useEffect(() => { fetchAll(); }, []);

    // ── CSV Export ──
    const exportCSV = () => {
        const header = "IP Address,Sessions,Country,Device,Risk Level,Last Seen\n";
        const rows = talkers.map(t =>
            `${t.ip},${t.sessions},${t.country},${t.deviceName},${t.riskLevel},${new Date(t.lastSeen).toLocaleString()}`
        );
        const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(blob),
            download: `network_traffic_${new Date().toISOString().split("T")[0]}.csv`
        });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // ── PDF Export ──
    const exportPDF = () => {
        const w = window.open("", "_blank");
        w.document.write(`
            <html><head><title>Network Traffic Report</title>
            <style>
                body{font-family:sans-serif;padding:24px;color:#1e293b}
                h1{color:#1d4ed8;border-bottom:2px solid #e2e8f0;padding-bottom:12px}
                table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}
                th,td{border:1px solid #e2e8f0;padding:8px;text-align:left}
                th{background:#f8fafc;font-weight:700}
                .footer{margin-top:32px;font-size:10px;color:#94a3b8;text-align:center}
            </style></head><body>
            <h1>QueryTel SOC — Network Traffic Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Period: ${startDate || "Last 24h"} → ${endDate || "Now"}</p>
            <p>Total Sessions: <strong>${overview.totalSessions.toLocaleString()}</strong> &nbsp;|&nbsp;
               Unique Source IPs: <strong>${overview.uniqueSrcIPs}</strong> &nbsp;|&nbsp;
               Unique Dest IPs: <strong>${overview.uniqueDstIPs}</strong></p>
            <table>
                <thead><tr><th>IP</th><th>Sessions</th><th>Country</th><th>Device</th><th>Risk</th><th>Last Seen</th></tr></thead>
                <tbody>
                    ${talkers.map(t => `<tr>
                        <td>${t.ip}</td><td>${t.sessions}</td><td>${t.country}</td>
                        <td>${t.deviceName}</td><td>${t.riskLevel}</td>
                        <td>${new Date(t.lastSeen).toLocaleString()}</td>
                    </tr>`).join("")}
                </tbody>
            </table>
            <div class="footer">Confidential — QueryTel Security Operations Center</div>
            </body></html>`);
        w.document.close();
        w.print();
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans pb-12 overflow-x-hidden selection:bg-blue-500/30">

            {/* Tactical grid background */}
            <div className="fixed inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

            <div className="relative p-6 space-y-6 max-w-[1600px] mx-auto">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                            <Network className="w-7 h-7 text-blue-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Network Traffic Analysis
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-blue-500" />
                                Real-Time Flow Intelligence · Last 24h
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={exportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all text-xs font-bold">
                            <Printer className="w-4 h-4" /> PDF Report
                        </button>
                        <button onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                            <FileText className="w-4 h-4" /> CSV Export
                        </button>
                        <button onClick={fetchAll} disabled={loading}
                            className="p-2 bg-[#0f172a] border border-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors">
                            <RotateCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* ── Security Intelligence Overview ── */}
                <div className={`p-5 rounded-[2rem] border transition-all duration-500 overflow-hidden relative group
                    ${analysis.riskLevel === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20' : 
                      analysis.riskLevel === 'MEDIUM' ? 'bg-orange-500/5 border-orange-500/20' : 
                      'bg-emerald-500/5 border-emerald-500/20'}`}>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg
                            ${analysis.riskLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
                              analysis.riskLevel === 'MEDIUM' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 
                              'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                            {analysis.riskLevel === 'CRITICAL' ? <ShieldAlert className="w-8 h-8" /> : 
                             analysis.riskLevel === 'MEDIUM' ? <AlertCircle className="w-8 h-8" /> : 
                             <ShieldCheck className="w-8 h-8" />}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest
                                    ${analysis.riskLevel === 'CRITICAL' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 
                                      analysis.riskLevel === 'MEDIUM' ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 
                                      'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'}`}>
                                    {analysis.riskLevel} Security Status
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono italic">Calculated from recent 1,000 traffic samples</span>
                            </div>
                            <h3 className="text-lg font-black text-white leading-tight italic tracking-tight">
                                {analysis.summary}
                            </h3>
                            {analysis.anomalies && analysis.anomalies.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {analysis.anomalies.map((a, i) => (
                                        <span key={i} className="text-[9px] font-black bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-slate-400 flex items-center gap-1.5 uppercase">
                                            <Zap className="w-3 h-3 text-blue-400" /> {a}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ── */}
                <div className="bg-[#0f172a]/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-5">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Filter className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Filters</span>
                    </div>

                    {/* Date range */}
                    <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-600" />
                            <input type="date"
                                className="bg-black/20 border border-slate-800 text-[10px] font-bold text-slate-300 px-2 py-1.5 rounded-lg outline-none focus:border-blue-500/50"
                                value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <span className="text-slate-600 text-[10px] font-bold">TO</span>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-600" />
                            <input type="date"
                                className="bg-black/20 border border-slate-800 text-[10px] font-bold text-slate-300 px-2 py-1.5 rounded-lg outline-none focus:border-blue-500/50"
                                value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    {/* Protocol / Category */}
                    <select value={category} onChange={e => setCategory(e.target.value)}
                        className="bg-black/20 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-blue-500/50 cursor-pointer">
                        <option value="all"                  className="bg-[#0f172a]">All Protocols</option>
                        <option value="SSL"                  className="bg-[#0f172a]">SSL</option>
                        <option value="DNS"                  className="bg-[#0f172a]">DNS</option>
                        <option value="VPN"                  className="bg-[#0f172a]">VPN</option>
                        <option value="IPS"                  className="bg-[#0f172a]">IPS</option>
                        <option value="Web Filter"           className="bg-[#0f172a]">Web Filter</option>
                        <option value="Application Control"  className="bg-[#0f172a]">Application Control</option>
                        <option value="Failed Login"         className="bg-[#0f172a]">Failed Login</option>
                        <option value="Admin Access"         className="bg-[#0f172a]">Admin Access</option>
                        <option value="General Traffic"      className="bg-[#0f172a]">General Traffic</option>
                    </select>

                    {/* Country filter */}
                    <div className="flex items-center gap-2 bg-black/20 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-blue-500/50">
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <input type="text" placeholder="Source Country (e.g. CN)"
                            className="bg-transparent text-[10px] font-bold text-slate-300 outline-none w-32 placeholder:text-slate-600"
                            value={srcCountry} onChange={e => setSrcCountry(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && fetchAll()} />
                    </div>

                    <button onClick={fetchAll} disabled={loading}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <Activity className="w-3.5 h-3.5" /> Apply Filters
                    </button>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={Wifi}      label="Total Sessions (24h)" value={overview.totalSessions}  color="blue" />
                    <StatCard icon={Server}    label="Unique Source IPs"    value={overview.uniqueSrcIPs}   color="purple" />
                    <StatCard icon={Globe}     label="Unique Dest IPs"      value={overview.uniqueDstIPs}   color="cyan" />
                    <StatCard icon={Layers}    label="Top Protocol"
                        value={overview.topCategory}
                        sub={overview.topCategoryCount ? `${overview.topCategoryCount.toLocaleString()} events` : undefined}
                        color="emerald" />
                </div>

                {/* ── Main Grid ── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Querying Network Intelligence...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* LEFT: Timeline + Protocol breakdown */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Traffic Volume Timeline */}
                            <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-500" /> Traffic Volume Timeline
                                    </h3>
                                    <span className="text-[9px] font-mono text-emerald-500 animate-pulse">● LIVE · 30-min buckets</span>
                                </div>
                                <div className="h-[260px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={timeline} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradErrors" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradWarnings" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                            <YAxis tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="sessions"  name="Sessions"  stroke="#3b82f6" fill="url(#gradSessions)"  strokeWidth={2} dot={false} />
                                            <Area type="monotone" dataKey="errors"    name="Errors"    stroke="#ef4444" fill="url(#gradErrors)"    strokeWidth={1.5} dot={false} />
                                            <Area type="monotone" dataKey="warnings"  name="Warnings"  stroke="#f59e0b" fill="url(#gradWarnings)"  strokeWidth={1.5} dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Protocol Breakdown */}
                            <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-purple-500" /> Protocol / Category Breakdown
                                </h3>
                                {protocols.length === 0 ? (
                                    <div className="h-48 flex items-center justify-center text-slate-600 text-[11px] italic uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                                        No protocol data available
                                    </div>
                                ) : (
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={protocols} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                                                <YAxis tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="value" name="Sessions" radius={[6, 6, 0, 0]}>
                                                    {protocols.map((_, i) => (
                                                        <Cell key={i} fill={PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]} fillOpacity={0.85} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Top Talkers + Geo Origins */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* Top Talkers */}
                            <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden">
                                <div className="px-6 py-4 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-orange-500" /> Top Talkers
                                    </h3>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">Top 15 · by sessions</span>
                                </div>
                                <div className="overflow-y-auto max-h-[320px] custom-scrollbar">
                                    {talkers.length === 0 ? (
                                        <div className="h-40 flex items-center justify-center text-slate-600 text-[11px] italic uppercase tracking-widest">
                                            No traffic data
                                        </div>
                                    ) : talkers.map((t, i) => (
                                        <React.Fragment key={t.ip}>
                                            <div 
                                                onClick={() => setExpandedIp(expandedIp === t.ip ? null : t.ip)}
                                                className={`px-5 py-4 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.03] transition-all group cursor-pointer
                                                ${expandedIp === t.ip ? 'bg-white/[0.04]' : ''}`}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-[10px] font-black text-slate-600 w-4 text-right">{i + 1}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-mono font-black text-white truncate">{t.ip}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase truncate">
                                                            {t.country} · {t.sessions.toLocaleString()} sessions
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${riskColor(t.riskLevel)}`}>
                                                        {t.riskLevel}
                                                    </span>
                                                    {expandedIp === t.ip ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />}
                                                </div>
                                            </div>
                                            
                                            {/* EXPANDED CONTENT */}
                                            {expandedIp === t.ip && (
                                                <div className="bg-black/40 border-b border-white/5 p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Source Interface / Device</span>
                                                            <code className="text-[10px] text-blue-400 font-mono font-bold leading-none">{t.deviceName}</code>
                                                        </div>
                                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Last Log Integrity</span>
                                                            <span className="text-[10px] text-emerald-400 font-bold leading-none">{new Date(t.lastSeen).toLocaleTimeString()} · Verified</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between gap-4 bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 backdrop-blur-sm">
                                                        <div className="min-w-0 pr-4">
                                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-1">Intelligence Reference</span>
                                                            <code className="text-[10px] text-slate-400 font-mono break-all line-clamp-1">FAZ_LOG_ID: {t.ip.split('.').join('')}_{t.sessions}</code>
                                                        </div>
                                                        <a 
                                                            href={`/logs?ip=${t.ip}`}
                                                            onClick={(e) => { e.preventDefault(); /* Would navigate to logs page with filter */ }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shrink-0 text-[10px] font-black uppercase tracking-tight"
                                                        >
                                                            Drill Logs <ArrowUpRight className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            {/* Geo Session Origins */}
                            <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden">
                                <div className="px-6 py-4 border-b border-white/5 bg-slate-900/40">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-emerald-500" /> Geo Session Origins
                                    </h3>
                                </div>
                                <div className="p-4 space-y-2 overflow-y-auto max-h-[280px] custom-scrollbar">
                                    {geoData.length === 0 ? (
                                        <div className="h-32 flex items-center justify-center text-slate-600 text-[11px] italic uppercase tracking-widest">
                                            No geo data
                                        </div>
                                    ) : (() => {
                                        const max = geoData[0]?.sessions || 1;
                                        return geoData.map((g, i) => (
                                            <div key={g.country} className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-slate-500 w-6 text-right">{i + 1}</span>
                                                <span className="text-[11px] font-black text-white uppercase w-8 tracking-widest">{g.country}</span>
                                                <div className="flex-1 bg-slate-800/60 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${Math.round((g.sessions / max) * 100)}%`,
                                                            background: PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono font-black text-slate-400 w-12 text-right">
                                                    {g.sessions.toLocaleString()}
                                                </span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
}
