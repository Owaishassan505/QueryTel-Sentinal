import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell
} from "recharts";
import {
    SlidersHorizontal, RotateCw, ShieldAlert, Activity,
    Search, Server, Globe, Calendar, ChevronDown, ChevronUp, Cpu,
    Zap, Lock, AlertTriangle, CheckCircle, Terminal, Info,
    Wifi, Database, Layers, Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Sub-Components ---

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-[#1e293b]/40 border border-slate-700/50 p-4 rounded-xl flex items-start justify-between backdrop-blur-sm hover:bg-[#1e293b]/60 transition-colors group">
        <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">{title}</span>
            <div className={`text-2xl font-black font-mono tracking-tight text-white group-hover:text-${color}-400 transition-colors`}>
                {value}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">{subtext}</span>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5" />
        </div>
    </div>
);

const StatusBadge = ({ severity }) => {
    const sev = severity?.toLowerCase() || 'info';
    let colors = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (sev.includes('crit')) colors = "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
    else if (sev.includes('error') || sev.includes('high') || sev.includes('elev')) colors = "bg-orange-500/10 text-orange-400 border-orange-500/20";
    else if (sev.includes('warn') || sev.includes('med')) colors = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    else if (sev.includes('low') || sev.includes('ok')) colors = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors} backdrop-blur-sm`}>
            {severity}
        </span>
    );
};

const SeverityTag = ({ level }) => {
    const l = level?.toUpperCase() || "INFO";
    let style = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    let glow = "";

    if (l.includes("CRIT")) {
        style = "bg-red-500/10 text-red-400 border-red-500/30";
        glow = "shadow-[0_0_15px_rgba(239,68,68,0.2)]";
    }
    else if (l.includes("HIGH") || l.includes("ELEV") || l.includes("ERR")) {
        style = "bg-orange-500/10 text-orange-400 border-orange-500/30";
    }
    else if (l.includes("MED") || l.includes("WARN")) {
        style = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
    else if (l.includes("LOW") || l.includes("OK")) {
        style = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }

    return (
        <span className={`px-3 py-1 rounded text-[11px] font-black tracking-wider border ${style} ${glow}`}>
            {l}
        </span>
    );
};

const ReportSection = ({ _title, _icon: Icon, children, className = "" }) => (
    <div className={`mb-8 ${className}`}>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800/50 pb-2">
            {Icon && <Icon className="w-4 h-4 text-blue-500" />}
            {_title}
        </h3>
        {children}
    </div>
);

const IntelligenceNeuralReport = React.memo(({ text, isLoading }) => {
    const report = useMemo(() => {
        const data = {
            id: `INT-${Math.floor(Math.random() * 90000) + 10000}`,
            threatLevel: "MODERATE",
            summary: "",
            anomalies: [],
            vectors: [],
            recommendations: [],
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + " UTC"
        };

        if (!text) return data;

        const lines = text.split('\n');
        let currentSection = 'summary';

        lines.forEach(line => {
            const l = line.trim().replace(/\*/g, '');
            if (!l || l.includes("User:") || l.match(/REPORT/i)) return;

            // Meta detection
            if (l.match(/STATUS:/i)) {
                data.timestamp = l.replace(/STATUS:/i, '').trim();
                return;
            }
            if (l.match(/Threat (?:Level|Condition):/i)) {
                const level = l.split(':')[1]?.trim().toUpperCase();
                if (level.includes("CRITICAL") || level.includes("HIGH")) data.threatLevel = "CRITICAL";
                else if (level.includes("ELEVATED") || level.includes("WARM")) data.threatLevel = "ELEVATED";
                else data.threatLevel = "STABLE";
                return;
            }

            // Section detection
            if (l.match(/Detected Patterns|Anomalies/i)) { currentSection = 'anomalies'; return; }
            if (l.match(/Sector Activity|Breakdown/i)) { currentSection = 'vectors'; return; }
            if (l.match(/Countermeasures|Recommendations|Actions/i)) { currentSection = 'recommendations'; return; }

            // Content parsing
            if (currentSection === 'summary') {
                if (l.length > 10) data.summary += (data.summary ? " " : "") + l;
            } else if (currentSection === 'anomalies') {
                const match = l.match(/^[^:]+:[^:]+$/) || l.includes(':');
                if (match) {
                    const [title, ...descParts] = l.split(':');
                    data.anomalies.push({
                        title: title.trim(),
                        desc: descParts.join(':').trim(),
                        id: Math.random().toString(36).substr(2, 9)
                    });
                }
            } else if (currentSection === 'vectors') {
                const match = l.match(/([A-Za-z\s]+):\s*(\d+)/i);
                if (match) {
                    data.vectors.push({ name: match[1].trim(), value: parseInt(match[2]) });
                }
            } else if (currentSection === 'recommendations') {
                const clean = l.replace(/^\d+\.\s*/, '').replace(/^[•\-]\s*/, '').trim();
                if (clean.length > 5) data.recommendations.push(clean);
            }
        });

        return data;
    }, [text]);

    if (isLoading) {
        return (
            <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/30 p-12 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent)] animate-pulse"></div>
                <div className="relative">
                    <div className="w-24 h-24 rounded-full border-t-2 border-l-2 border-blue-500 animate-spin"></div>
                    <div className="absolute inset-2 w-20 h-20 rounded-full border-r-2 border-b-2 border-cyan-400 animate-spin-reverse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu className="w-8 h-8 text-blue-400 animate-pulse" />
                    </div>
                </div>
                <h3 className="text-xl font-black text-white mt-8 tracking-tighter uppercase italic">Engaging Neural Core</h3>
                <p className="text-blue-400/60 font-mono text-[10px] mt-2 uppercase tracking-widest animate-pulse">Synthesizing Tactical Intelligence...</p>
            </div>
        );
    }

    if (!text) return null;

    return (
        <div className="space-y-6">
            {/* Intel Header */}
            <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-3xl border border-white/5 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${report.threatLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        report.threatLevel === 'ELEVATED' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-500'
                        }`}>
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Neural Investigation</h2>
                            <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded text-slate-500">{report.id}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Status: {report.timestamp}</p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${report.threatLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' :
                    report.threatLevel === 'ELEVATED' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                    {report.threatLevel} CONDITION
                </div>
            </div>

            {/* Tactical Narrative */}
            <div className="bg-gradient-to-br from-blue-600/10 to-transparent rounded-3xl border border-blue-500/10 p-6">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Tactical Narrative
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                    "{report.summary || "Analysis indicates autonomous monitoring is within stable parameters. No immediate critical deviations detected in current telemetry window."}"
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Anomalies Card */}
                <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-3xl border border-white/5 p-6 h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" /> Detected Anomalies
                        </h3>
                        {report.anomalies.length > 0 && <span className="text-[10px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">{report.anomalies.length} Found</span>}
                    </div>

                    <div className="space-y-3">
                        {report.anomalies.length > 0 ? report.anomalies.map((a, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={a.id}
                                className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-orange-500/30 transition-colors group"
                            >
                                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors uppercase tracking-wide">{a.title}</h4>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{a.desc}</p>
                            </motion.div>
                        )) : (
                            <div className="h-32 flex flex-col items-center justify-center text-slate-600 italic text-[10px] uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                                No anomalous patterns identified
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommendations Card */}
                <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-3xl border border-white/5 p-6 h-full">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Directives
                    </h3>
                    <div className="space-y-3">
                        {report.recommendations.length > 0 ? report.recommendations.map((r, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 group hover:bg-emerald-500/10 transition-colors"
                            >
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[9px] font-black text-emerald-500">{i + 1}</span>
                                </div>
                                <span className="text-[11px] text-slate-300 font-medium group-hover:text-white transition-colors">{r}</span>
                            </motion.div>
                        )) : (
                            <div className="h-32 flex flex-col items-center justify-center text-slate-600 italic text-[10px] uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                                Monitoring baseline sustained
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Intel */}
            <div className="pt-4 flex justify-between items-center opacity-30">
                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Neural Link: Encrypted v3.2</p>
                <div className="flex gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                </div>
            </div>
        </div>
    );
});

export default function Analysis() {
    const [summary, setSummary] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [timeline, setTimeline] = useState([]);
    const [filters, setFilters] = useState({ severity: "", device: "", category: "", srcCountry: "" });
    const [results, setResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(false);
    const [showFilters, setShowFilters] = useState(true);

    const token = localStorage.getItem("token");
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // Stats
    const totalEvents = timeline.reduce((acc, curr) => acc + (curr.errors || 0) + (curr.warnings || 0) + (curr.info || 0), 0);
    const criticalEvents = timeline.reduce((acc, curr) => acc + (curr.errors || 0), 0);

    const fetchSummary = async () => {
        setIsThinking(true);
        try {
            const res = await axios.get("/api/analysis/summary", authHeader);
            setSummary(res.data.summary);
        } catch (err) {
            console.error(err);
            setSummary("SYSTEM ADVISORY: AI Nexus latency detected.\n\nSTATUS: Processing Queued\nThreat Level: STABLE\n\nDetected Patterns & Anomalies:\nOperational Delay: High neural load detected on correlation core.\n\nStrategic Countermeasures:\n1. Execute 'RESCAN INTELLIGENCE' manual override.\n2. Verify local node health via Telemetry Feed.");
        } finally {
            setIsThinking(false);
        }
    };

    const fetchTimeline = async () => {
        try {
            const res = await axios.get("/logs/timeseries", authHeader);
            if (Array.isArray(res.data)) {
                setTimeline(res.data.map(item => ({
                    ts: item.time,
                    errors: item.errors || 0,
                    info: item.info || 0
                })));
            }
        } catch (err) { }
    };

    const applyFilters = async () => {
        setLoadingResults(true);
        try {
            const res = await axios.post("/api/analysis/filter", filters, authHeader);
            setResults(res.data.results || []);
        } finally {
            setLoadingResults(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchTimeline();
        applyFilters();
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30 font-sans pb-12 overflow-x-hidden">
            {/* Tactical Grid Background */}
            <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

            <div className="relative p-6 space-y-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                            <Terminal className="w-7 h-7 text-blue-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Strategic Deep Analysis</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-blue-500" /> Neural Correlation Engine v3.2
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchSummary}
                            disabled={isThinking}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
                        >
                            <Zap className={`w-4 h-4 ${isThinking ? 'animate-spin' : ''}`} />
                            {isThinking ? 'Correlating Data...' : 'RESCAN INTELLIGENCE'}
                        </button>
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Primary Content */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Summary Area */}
                        {useMemo(() => (
                            <IntelligenceNeuralReport text={summary} isLoading={isThinking} />
                        ), [summary, isThinking])}

                        {/* Velocity View */}
                        {useMemo(() => (
                            <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-500" /> Event Velocity Telemetry
                                    </h3>
                                    <div className="text-[10px] font-mono text-slate-500">REALTIME DATA FEED v1.02</div>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer>
                                        <AreaChart data={timeline}>
                                            <defs>
                                                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="ts" hide />
                                            <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff', fontSize: '10px' }}
                                            />
                                            <Area type="monotone" dataKey="info" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBlue)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ), [timeline])}
                    </div>

                    {/* Right Panel: Controls & Live Stream */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-emerald-500" /> Investigation Scope
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Severity (Crit..)"
                                            value={filters.severity}
                                            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                                        />
                                        <input
                                            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Device ID"
                                            value={filters.device}
                                            onChange={(e) => setFilters({ ...filters, device: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Category (e.g. SSL)"
                                            value={filters.category}
                                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                        />
                                        <input
                                            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Source Country"
                                            value={filters.srcCountry}
                                            onChange={(e) => setFilters({ ...filters, srcCountry: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={applyFilters}
                                    disabled={loadingResults}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] transition-all border border-white/5 active:scale-95 disabled:opacity-50"
                                >
                                    {loadingResults ? "Filtering Datastream..." : "Apply Tactical Filters"}
                                </button>
                            </div>
                        </div>

                        {/* Live Telemetry */}
                        <div className="bg-[#0f172a]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden flex flex-col h-[600px]">
                            <div className="p-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-purple-500" /> Telemetry Feed
                                </h3>
                                <span className="text-[9px] font-mono text-emerald-500 animate-pulse">● LIVE</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {results.map((log, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-all group cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-mono text-slate-500">{log.ts}</span>
                                            <StatusBadge severity={log.severity} />
                                        </div>
                                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium line-clamp-2">{log.message}</p>
                                        <div className="mt-3 flex items-center gap-3 text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                                            <Server className="w-3 h-3" /> {log.deviceName}
                                            {log.srcCountry && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {log.srcCountry}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .animate-spin-reverse {
                    animation: spin-reverse 3s linear infinite;
                }
            `}</style>
        </div>
    );
}

const MetricPill = ({ label, value, trend, trendUp }) => (
    <div className="bg-[#1e293b]/50 border border-white/5 px-5 py-3 rounded-2xl flex flex-col items-start gap-1">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <div className="flex items-end gap-2 text-white">
            <span className="text-xl font-black tracking-tighter leading-none">{value}</span>
            {trend && <span className={`text-[9px] font-black ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>{trendUp ? '↑' : '↓'} {trend}</span>}
        </div>
    </div>
);

const MetricPillSmall = ({ label, value }) => (
    <div className="flex flex-col items-end">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
        <p className="text-sm font-black text-white italic tracking-tighter leading-none">{value}</p>
    </div>
);

