import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import {
    FileDown, RefreshCw, AlertTriangle, ShieldAlert,
    Globe, Rss, ExternalLink, ShieldCheck, Zap,
    AlertCircle, Activity, User
} from "lucide-react";

export default function AIThreatInsights() {
    const [insights, setInsights] = useState([]);
    const [headlines, setHeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [insightsRes, headlinesRes] = await Promise.all([
                apiFetch("/api/threat-insights"),
                apiFetch("/api/darkweb/headlines")
            ]);

            if (insightsRes.ok) setInsights(insightsRes.data || []);
            if (headlinesRes.ok) setHeadlines(headlinesRes.data.items || []);

            if (!insightsRes.ok && !headlinesRes.ok) {
                setError("Failed to load Intelligence data.");
            }
        } catch (err) {
            setError("Heuristic Engine Offline.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportToCSV = () => {
        const headers = ["Source", "Type", "Severity", "Description", "Date"];
        const rows = [
            ...insights.map(i => ["Heuristic", i.type, i.severity, i.description, i.timestamp]),
            ...headlines.map(h => [h.source, "Global Breach", h.exposure ? "Critical" : "Info", h.title, h.date])
        ];

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",").replace(/\n/g, " ")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Global_Threat_Audit_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden pb-12 relative">
            {/* Tactical Grid Background */}
            <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

            <div className="relative p-6 space-y-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">AI Threat Intelligence Matrix</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-blue-500" /> Unified Breach Analysis :: Real-time Sync
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            className="px-5 py-2.5 bg-[#0f172a] border border-slate-800 text-slate-400 rounded-xl hover:text-white hover:border-slate-600 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            SYNC NODES
                        </button>

                        <button
                            onClick={exportToCSV}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <FileDown className="w-4 h-4" />
                            EXPORT
                        </button>
                    </div>
                </div>

                {loading && insights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full animate-ping absolute top-0 left-0"></div>
                            <Zap className="w-16 h-16 text-blue-500 animate-pulse relative z-10" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Interrogating Global Breach Registries...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 rounded-[2.5rem] bg-red-500/5 border border-red-500/20 text-red-400 text-center flex flex-col items-center gap-4">
                        <AlertCircle className="w-12 h-12 opacity-50" />
                        <p className="font-black uppercase tracking-widest text-xs">{error}</p>
                        <button onClick={fetchData} className="text-[10px] underline uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Retry Handshake</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                        {/* LEFT COLUMN: HEURISTIC PATTERNS */}
                        <div className="xl:col-span-4 space-y-6">
                            <div className="flex items-center gap-2 px-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Heuristic Patterns</h2>
                            </div>

                            <div className="space-y-4">
                                {insights.length === 0 ? (
                                    <div className="p-8 bg-black/20 rounded-3xl border border-dashed border-slate-800 text-center">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No compromised vectors detected</p>
                                    </div>
                                ) : (
                                    insights.map((item, idx) => (
                                        <div key={idx} className="group bg-[#0f172a]/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 hover:border-blue-500/30 transition-all relative overflow-hidden">
                                            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 pointer-events-none ${item.severity === 'Critical' ? 'bg-red-500' : 'bg-blue-500'
                                                }`}></div>

                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-black text-blue-400 uppercase tracking-tighter">{item.type}</span>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${item.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                    item.severity === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                    {item.severity}
                                                </span>
                                            </div>
                                            <p className="text-slate-300 text-xs font-medium leading-relaxed mb-4">{item.description}</p>
                                            <div className="text-[9px] font-mono font-bold text-slate-600 uppercase">{item.timestamp}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: GLOBAL BREACH FEED */}
                        <div className="xl:col-span-8 space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-500 animate-pulse" />
                                    <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Global Intelligence Feed</h2>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Live darkweb monitor</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {headlines.map((h, idx) => (
                                    <div key={idx} className="bg-[#0f172a]/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                    <Rss className="w-3 h-3 text-slate-500" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{h.source}</span>
                                                </div>
                                                {h.exposure && (
                                                    <div className="px-2 py-0.5 bg-red-500/20 rounded-lg border border-red-500/30 flex items-center gap-1.5">
                                                        <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                                                        <span className="text-[8px] font-black text-red-400 uppercase">Credential Leak</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-bold text-white leading-snug group-hover:text-blue-400 transition-colors">{h.title}</h3>
                                        </div>

                                        <div className="mt-8 flex items-center justify-between">
                                            <span className="text-[9px] font-mono font-bold text-slate-600">INSPECTION: {h.date}</span>
                                            <a
                                                href={h.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white hover:bg-blue-600 transition-all"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {headlines.length === 0 && !loading && (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                    <Globe className="w-12 h-12 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting ingress from encrypted subnets...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
