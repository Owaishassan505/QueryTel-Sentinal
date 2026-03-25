import React, { useEffect, useState, useMemo } from "react";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    BarChart, Bar, Cell
} from "recharts";
import {
    SlidersHorizontal, RotateCw, ShieldAlert, Activity,
    Search, Server, Globe, ChevronDown, ChevronUp, Cpu,
    Zap, Lock, AlertTriangle, CheckCircle, Terminal, Info,
    Wifi, Database, Layers, Hash, FileText, Download, Share2,
    Filter, RefreshCw, Radio, HardDrive, AlertCircle, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Tactical UI Components ---

const GlassCard = ({ children, className = "", noPadding = false }) => (
    <div className={`bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, color = "blue" }) => (
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]`}>
                <Icon className={`w-5 h-5 text-brand-primary`} />
            </div>
            <div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic leading-none">{title}</h3>
                {subtitle && <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">{subtitle}</p>}
            </div>
        </div>
        <div className="h-px bg-white/5 flex-1 mx-8 hidden xl:block"></div>
    </div>
);

const MetricPill = ({ label, value, trend, trendUp }) => (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5 hover:border-brand-primary/30 transition-all group">
        <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
            <div className="flex items-end gap-2">
                <span className="text-xl font-black text-white tracking-tighter leading-none">{value}</span>
                {trend && (
                    <span className={`text-[9px] font-black ${trendUp ? 'text-emerald-500' : 'text-rose-500'} mb-0.5`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>
        </div>
    </div>
);

// --- Intelligence Report Component (The "Modern" AI Card) ---

const IntelligenceNeuralReport = ({ text, isLoading }) => {
    const report = useMemo(() => {
        const data = {
            id: `INT-${Math.floor(Math.random() * 90000) + 10000}`,
            threatLevel: "STABLE",
            summary: "",
            anomalies: [],
            vectors: [],
            recommendations: [],
            timestamp: new Date().toLocaleTimeString()
        };

        if (!text) return data;

        const lines = text.split('\n');
        let section = 'summary';

        lines.forEach(line => {
            const l = line.trim();
            if (!l || l.includes("User:") || l.includes("REPORT") || l.includes("STATUS")) return;

            if (l.match(/Threat.*Level|Condition/i)) {
                if (l.includes("CRITICAL")) data.threatLevel = "CRITICAL";
                else if (l.includes("HIGH")) data.threatLevel = "ELEVATED";
                else if (l.includes("MODERATE") || l.includes("MEDIUM")) data.threatLevel = "MODERATE";
                else if (l.includes("LOW")) data.threatLevel = "NOMINAL";
                return;
            }

            if (l.includes("Detected Patterns") || l.includes("Anomalies")) section = 'anomalies';
            else if (l.includes("Strategic Countermeasures") || l.includes("Recommended")) section = 'recommendations';
            else if (l.includes("Sector Activity") || l.includes("Breakdown")) section = 'vectors';

            if (section === 'summary' && !l.startsWith('#') && !l.startsWith('*')) {
                data.summary += " " + l.replace(/\*\*/g, '');
            } else if (section === 'anomalies') {
                const match = l.match(/^[•-]\s*(.*)/);
                if (match) {
                    const parts = match[1].split(':');
                    data.anomalies.push({
                        title: parts[0].replace(/\*\*/g, '').trim(),
                        desc: parts[1] ? parts[1].trim() : ""
                    });
                }
            } else if (section === 'vectors') {
                const match = l.match(/^[•-]\s*([A-Za-z\s]+):\s*(\d+|\?)\s*events?.*(?:\(([\d\.]+)%\))?/i);
                if (match) {
                    data.vectors.push({
                        label: match[1].trim(),
                        pct: match[3] ? parseFloat(match[3]) : Math.floor(Math.random() * 30) + 5
                    });
                }
            } else if (section === 'recommendations') {
                const match = l.match(/^[•-\d.]+\s*(.*)/);
                if (match) data.recommendations.push(match[1].replace(/\*\*/g, '').trim());
            }
        });

        return data;
    }, [text]);

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                <div className="relative mb-10">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="w-32 h-32 border-[1px] border-brand-primary/20 rounded-full border-t-brand-primary"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute inset-4 border-[1px] border-indigo-500/20 rounded-full border-b-indigo-500"
                    />
                    <Cpu className="absolute inset-0 m-auto text-brand-primary w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-4 italic">Neural Processing</h3>
                <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            className="w-2 h-2 bg-brand-primary rounded-full shadow-[0_0_10px_#3b82f6]"
                        />
                    ))}
                </div>
            </div>
        );
    }

    const getThreatStyles = () => {
        switch (report.threatLevel) {
            case 'CRITICAL': return 'text-rose-500 border-rose-500/30 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.1)]';
            case 'ELEVATED': return 'text-amber-500 border-amber-500/30 bg-amber-500/5';
            case 'MODERATE': return 'text-indigo-400 border-indigo-400/30 bg-indigo-400/5';
            default: return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Identity */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white/5 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-[0_0_25px_rgba(79,70,229,0.3)]">
                        <Radar className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-white tracking-widest uppercase italic leading-none">AI Insight Engine</h2>
                            <Badge color="blue" className="mt-0.5">Llama-3.2 Active</Badge>
                        </div>
                        <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                            Correlation ID: {report.id} • Processed at {report.timestamp}
                        </p>
                    </div>
                </div>
                <div className={`mt-6 md:mt-0 px-8 py-3 rounded-2xl border-2 flex flex-col items-center ${getThreatStyles()}`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Neural Status</span>
                    <span className="text-xl font-black tracking-widest italic">{report.threatLevel}</span>
                </div>
            </div>

            {/* Content Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-brand-primary" /> Tactical Narrative
                    </h3>
                    <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 shadow-inner leading-relaxed text-sm font-medium text-slate-300 italic border-l-4 border-l-indigo-500">
                        {report.summary || "No intelligence gathered in current cycle."}
                    </div>
                </div>

                {/* Left Area: Findings & Anomalies */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.anomalies.map((a, i) => (
                            <div key={i} className="group p-5 bg-[#1e293b]/40 rounded-[2rem] border border-white/5 hover:border-brand-primary/30 transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-brand-primary/20 shrink-0">
                                        <AlertCircle className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1.5">{a.title}</h4>
                                        <p className="text-[10px] text-slate-400 leading-normal font-medium">{a.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vectors / Visual Breakdown */}
                    {report.vectors.length > 0 && (
                        <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Attack Vector Distribution</h3>
                            <div className="flex items-end gap-2 h-32">
                                {report.vectors.map((v, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                                        <div className="w-full bg-slate-900 rounded-lg relative overflow-hidden" style={{ height: `${v.pct}%` }}>
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: '100%' }}
                                                className="absolute bottom-0 w-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                            />
                                        </div>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter text-center truncate w-full">{v.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Area: Action Items */}
                <div className="lg:col-span-4 flex flex-col">
                    <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[3rem] h-full">
                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4" /> Defense Directives
                        </h3>
                        <div className="space-y-5">
                            {report.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-4 group">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-300 leading-relaxed group-hover:text-white transition-colors">{rec}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-5 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto-Mitigation</span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium italic">"Sentinel is currently in manual override mode. Click above to deploy these countermeasures to peripheral nodes."</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Page Main Component ---

export default function Analysis() {
    const [summary, setSummary] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchSummary = async () => {
        setIsThinking(true);
        try {
            const res = await fetch("/api/analysis/summary");
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            setSummary(data.summary || "No data gathered.");
        } catch (err) {
            console.error(err);
            setSummary("System Error: AI core heartbeat lost.\n\n[ERR_CON_TIMEOUT]");
        } finally {
            setIsThinking(false);
        }
    };

    useEffect(() => { fetchSummary(); }, []);

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-1000">

            {/* 1. TOP GLOBAL COMMAND BAR */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-[#0f172a]/80 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black text-white tracking-widest uppercase italic leading-none">Analysis Module</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">
                                <Radio className="w-3 h-3 text-indigo-500 animate-pulse" /> Sector: L7 Core Ingress
                            </span>
                            <div className="h-3 w-px bg-white/10"></div>
                            <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">
                                {currentTime.getTime()} • {currentTime.toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full xl:w-auto">
                    <MetricPill label="Nodes Scanned" value="24/24" trend="100%" trendUp />
                    <MetricPill label="Anomaly Confidence" value="98.2%" trend="0.4%" trendUp />
                    <MetricPill label="Active Heuristics" value="1,402" trend="+12" trendUp />
                    <button
                        onClick={fetchSummary}
                        disabled={isThinking}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-3xl text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-indigo-500/60 transition-all font-black uppercase text-xs tracking-widest italic active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isThinking ? 'animate-spin' : ''}`} />
                        {isThinking ? 'Processing...' : 'Sync Intelligence'}
                    </button>
                </div>
            </div>

            {/* 2. MAIN INTELLIGENCE WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Controller & Filter Stack (3 Cols) */}
                <div className="lg:col-span-3 space-y-6">
                    <GlassCard>
                        <SectionHeader icon={Filter} title="Tactical Scope" subtitle="Audit Constraints" />
                        <div className="space-y-5">
                            {['Log Category', 'Severity Threshold', 'Geo-Fence Region', 'Data Window'].map((f) => (
                                <div key={f} className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{f}</label>
                                    <div className="relative group">
                                        <select className="w-full bg-[#020617] border border-white/5 rounded-2xl px-5 py-3 text-[11px] font-black text-slate-300 outline-none focus:border-indigo-500/50 transition-all cursor-pointer hover:bg-white/5 appearance-none uppercase italic">
                                            <option>Full Distribution</option>
                                            <option>Restricted Only</option>
                                            <option>Anomaly Subset</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-700 pointer-events-none group-hover:text-indigo-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard className="bg-gradient-to-br from-indigo-900/10 to-transparent">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Core Status</span>
                        </div>
                        <div className="space-y-4">
                            {[
                                { n: 'Heuristic-Engine', s: 'Online' },
                                { n: 'Pattern-Matcher', s: 'Synced' },
                                { n: 'Threat-Feed', s: 'Active' },
                            ].map(x => (
                                <div key={x.n} className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-slate-500 italic">{x.n}</span>
                                    <span className="text-slate-200">{x.s}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Primary Intelligence Center (9 Cols) */}
                <div className="lg:col-span-9 flex flex-col gap-6">
                    <GlassCard className="relative min-h-[600px] flex-1">
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

                        <div className="relative z-10 w-full h-full">
                            <IntelligenceNeuralReport text={summary} isLoading={isThinking} />
                        </div>
                    </GlassCard>

                    {/* Secondary Feed/Chart Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="flex flex-col">
                            <SectionHeader icon={Activity} title="Event Velocity" subtitle="Temporal Distribution" />
                            <div className="h-40 w-full">
                                <ResponsiveContainer>
                                    <AreaChart data={[
                                        { t: '0h', v: 40 }, { t: '4h', v: 30 }, { t: '8h', v: 90 },
                                        { t: '12h', v: 45 }, { t: '16h', v: 60 }, { t: '20h', v: 35 }, { t: '24h', v: 50 }
                                    ]}>
                                        <defs>
                                            <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="v" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#velocityGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <SectionHeader icon={HardDrive} title="Storage Matrix" subtitle="Cluster Ingestion" />
                            <div className="space-y-4 mt-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                                        <span className="text-slate-500">Node-Alpha-01</span>
                                        <span className="text-white">82%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                        <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-indigo-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                                        <span className="text-slate-500">Node-Gamma-05</span>
                                        <span className="text-white">12%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                        <motion.div initial={{ width: 0 }} animate={{ width: '12%' }} className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-spin-reverse { animation: spin-reverse 8s linear infinite; }
                @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #312e81; border-radius: 20px; }
            ` }} />
        </div>
    );
}

// Helper components
const Badge = ({ children, color = "blue", className = "" }) => (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 ${className}`}>
        {children}
    </span>
);

const Radar = ({ className }) => (
    <div className={className}>
        <div className="relative">
            <Radio className="w-8 h-8 text-white relative z-10" />
            <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-white/30 rounded-full"
            />
        </div>
    </div>
);

const ShieldCheck = ({ className }) => (
    <ShieldAlert className={className} />
);
