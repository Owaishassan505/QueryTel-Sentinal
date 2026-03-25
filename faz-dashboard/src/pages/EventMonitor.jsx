import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Activity,
    Shield,
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    Clock,
    ExternalLink,
    RefreshCw,
    TrendingUp,
    Zap,
    Aperture,
    Target,
    ChevronRight,
    ChevronLeft,
    Search
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { backendURL } from '../config';

const EventMonitor = () => {
    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState({
        critical: 0,
        high: 0,
        medium: 0,
        prevented: 0,
        unmitigated: 0,
        spikeDetected: false
    });
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [promoting, setPromoting] = useState(null);
    const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEvents, setTotalEvents] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            const res = await axios.get(`${backendURL}/api/soc/event-monitor/live`, {
                params: { page, limit: 15 }
            });
            const { events: newEvents, summary: newSummary, timeline: newTimeline, pagination } = res.data;

            setEvents(newEvents);
            setSummary(newSummary);
            setTotalPages(pagination.totalPages);
            setTotalEvents(pagination.total);

            // Format timeline for Recharts (60 minute buckets)
            const formattedTimeline = Array.from({ length: 60 }, (_, i) => {
                const minuteData = newTimeline.filter(t => t._id.minute === i);
                return {
                    minute: i,
                    label: `${i}m`,
                    critical: minuteData.find(m => m._id.severity === 'critical')?.count || 0,
                    high: minuteData.find(m => ['error', 'high'].includes(m._id.severity))?.count || 0,
                    medium: minuteData.find(m => ['warning', 'warn', 'medium'].includes(m._id.severity))?.count || 0,
                };
            }).sort((a, b) => {
                // Circular sort based on current minute (last 60 mins)
                const currentMin = new Date().getMinutes();
                return ((a.minute - currentMin + 60) % 60) - ((b.minute - currentMin + 60) % 60);
            });

            setTimeline(formattedTimeline);
            setLastUpdateTime(new Date());
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch event monitor data:", err);
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, [fetchData]);

    const promoteToIncident = async (event) => {
        setPromoting(event._id);
        try {
            await axios.post(`${backendURL}/api/soc/events/${event._id}/promote`, {
                analyst: "System User" // Should come from auth context
            });
            // Show success toast or notification
            alert(`Event promoted to Incident: ${event.eventName}`);
        } catch (err) {
            console.error("Promotion failed:", err);
        } finally {
            setPromoting(null);
        }
    };

    const getSeverityColor = (sev) => {
        const s = (sev || "").toLowerCase();
        if (s === 'critical') return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (['error', 'high'].includes(s)) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        if (['warning', 'warn', 'medium'].includes(s)) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 p-6 space-y-6">

            {/* TOP HEADER: SOC RADAR STATUS */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] shadow-2xl">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                            <Aperture className="w-8 h-8 text-blue-500 animate-[spin_4s_linear_infinite]" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#020617] animate-pulse"></div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">
                            EVENT <span className="text-blue-500">MONITOR</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-emerald-500" /> Real-Time Tactical Stream • Last Update: {lastUpdateTime.toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 min-w-[140px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Critical</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-black text-red-500 italic">{summary.critical}</span>
                            <ShieldAlert className="w-4 h-4 text-red-500/50" />
                        </div>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 min-w-[140px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">High Risk</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-black text-orange-500 italic">{summary.high}</span>
                            <AlertTriangle className="w-4 h-4 text-orange-500/50" />
                        </div>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 min-w-[140px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Unmitigated</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-black text-pink-500 italic">{summary.unmitigated}</span>
                            <Zap className="w-4 h-4 text-pink-500/50" />
                        </div>
                    </div>
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 min-w-[140px]">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Spike Detection</p>
                        <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase italic ${summary.spikeDetected ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                                {summary.spikeDetected ? '⚠️ SPIKE ALERT' : '✅ NORMAL'}
                            </span>
                            <Activity className={`w-4 h-4 ${summary.spikeDetected ? 'text-red-500' : 'text-emerald-500'}`} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LIVE TIMELINE (60 MINS) */}
                <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] shadow-xl h-[530px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Tactical Timeline</h3>
                            <p className="text-[9px] font-bold text-slate-500 tracking-widest mt-1 uppercase">Event density (Last 60 Minutes)</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                    </div>

                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 8, fill: '#64748b', fontWeight: 800 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={9}
                                />
                                <YAxis
                                    tick={{ fontSize: 8, fill: '#64748b', fontWeight: 800 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Bar dataKey="critical" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="high" stackId="a" fill="#f97316" />
                                <Bar dataKey="medium" stackId="a" fill="#f59e0b" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Rate</p>
                            <p className="text-xs font-black text-white italic">~{Math.round(summary.last5mCount / 5)}/min</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Peak Rate</p>
                            <p className="text-xs font-black text-white italic">{Math.max(...timeline.map(t => t.critical + t.high + t.medium))} hits</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Noise Reduction</p>
                            <p className="text-xs font-black text-emerald-500 italic">94.2%</p>
                        </div>
                    </div>
                </div>

                {/* LIVE EVENT FEED */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/5 to-transparent">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-blue-500" />
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Real-Time Event Feed</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Live Events: {totalEvents}</span>
                            <RefreshCw className={`w-3 h-3 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[400px]">
                        <table className="w-full text-left border-separate border-spacing-y-2 px-6">
                            <thead className="sticky top-0 bg-[#0f172a] z-10">
                                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <th className="py-4">Severity</th>
                                    <th className="py-4">Event & Detail</th>
                                    <th className="py-4">Source / Target</th>
                                    <th className="py-4 text-center">Hits</th>
                                    <th className="py-4 text-right">Escalate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event, idx) => (
                                    <tr
                                        key={event._id}
                                        className={`group bg-white/[0.02] hover:bg-white/[0.05] transition-all transform hover:scale-[1.01] animate-in slide-in-from-right-2 duration-300`}
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <td className="py-4 px-4 first:rounded-l-2xl border-l border-t border-b border-white/5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border leading-none block w-fit ${getSeverityColor(event.severity)}`}>
                                                {event.severity}
                                            </span>
                                        </td>
                                        <td className="py-4 border-t border-b border-white/5">
                                            <div>
                                                <p className="text-[11px] font-black text-white italic leading-tight mb-1">{event.eventName}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-black text-blue-500/70 uppercase tracking-widest">{event.category}</span>
                                                    <span className="text-[8px] text-slate-600">•</span>
                                                    <span className="text-[8px] font-bold text-slate-500">{new Date(event.lastSeen).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 border-t border-b border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-600 uppercase">SRC</span>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400">{event.source}</span>
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-slate-700" />
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-600 uppercase">DST</span>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400">{event.target || 'Internal'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center border-t border-b border-white/5">
                                            <div className="inline-flex items-center justify-center bg-blue-600/10 border border-blue-500/20 rounded-lg px-2 py-1 min-w-[32px]">
                                                <span className="text-[10px] font-black text-blue-400">{event.occurrenceCount || 1}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 last:rounded-r-2xl border-r border-t border-b border-white/5 text-right">
                                            <button
                                                onClick={() => promoteToIncident(event)}
                                                disabled={promoting === event._id}
                                                className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all group disabled:opacity-50"
                                            >
                                                {promoting === event._id ? (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <ShieldAlert className="w-3.5 h-3.5 transform group-hover:scale-110" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {events.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center text-slate-600 font-black uppercase tracking-[0.3em] opacity-30 italic">
                                            Scanning for live tactical events...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION FOOTER */}
                    <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Showing page <span className="text-blue-500">{page}</span> of <span className="text-blue-500">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 transition-all flex items-center gap-2"
                            >
                                <ChevronLeft className="w-3 h-3" /> Prev
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-30 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                            >
                                Next <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            ` }} />
        </div>
    );
}

export default EventMonitor;
