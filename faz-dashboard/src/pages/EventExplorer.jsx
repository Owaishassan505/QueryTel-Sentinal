import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Activity,
    Clock,
    AlertTriangle,
    RefreshCw,
    BarChart3,
    Target,
    Zap,
    Database,
    Cpu,
    Radar,
    Search,
    ChevronLeft,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { backendURL } from '../config';

// Import Reusable Dark Components
import LogTable from '../components/Logs/LogTable';

const COLORS = {
    critical: "#FF3B3B",
    high: "#FF9F0A",
    medium: "#22C55E",
    low: "#3B82F6",
};

const EventExplorer = () => {
    const [events, setEvents] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [severityStats, setSeverityStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalEvents, setTotalEvents] = useState(0);
    const [syncStatus, setSyncStatus] = useState(100);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [activeFilters, setActiveFilters] = useState([]);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

    const FILTER_OPTIONS = [
        { label: "Device ID", key: "deviceId" },
        { label: "Severity", key: "severity" },
        { label: "Destination IP", key: "destIp" },
        { label: "Action", key: "action" },
        { label: "Service", key: "service" },
        { label: "User", key: "user" },
        { label: "Device Name", key: "deviceName" },
        { label: "Virtual Domain", key: "vd" },
        { label: "Type", key: "type" },
        { label: "Sub Type", key: "subType" },
        { label: "UEBA User ID", key: "uebaUserId" },
        { label: "UEBA Endpoint ID", key: "uebaEndpointId" },
        { label: "Destination End User ID", key: "dstEndUserId" },
        { label: "Destination Endpoint ID", key: "dstEndpointId" }
    ];

    const fetchEvents = async () => {
        setIsRefreshing(true);
        try {
            const params = {
                page,
                limit: 14,
                search: searchQuery
            };

            // Add active filters to params
            activeFilters.forEach(f => {
                params[f.key] = f.value;
            });

            const res = await axios.get(`${backendURL}/api/soc/events`, { params });
            // Map event objects back to what LogTable expects
            const mapped = (res.data.events || []).map(e => ({
                ...e,
                sourceIp: e.source,
                destIp: e.target,
                humanMessage: e.eventName,
                ts: e.lastSeen,
                severity: e.severity || 'info'
            }));
            setEvents(mapped);
            setTotalEvents(res.data.pagination?.total || 0);
        } catch (err) {
            console.error("Failed to fetch events:", err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const addFilter = (option) => {
        const val = window.prompt(`Enter value for ${option.label}:`);
        if (val) {
            setActiveFilters(prev => [...prev.filter(f => f.key !== option.key), { ...option, value: val }]);
            setPage(1);
        }
        setFilterMenuOpen(false);
    };

    const removeFilter = (key) => {
        setActiveFilters(prev => prev.filter(f => f.key !== key));
        setPage(1);
    };

    useEffect(() => {
        fetchEvents();
    }, [page, searchQuery, activeFilters]);

    const fetchAnalytics = async () => {
        try {
            const [statsRes, logsStatsRes] = await Promise.all([
                axios.get(`${backendURL}/api/soc/events/stats`),
                axios.get(`${backendURL}/api/logs/stats`)
            ]);

            setTrendData(statsRes.data);

            const ls = logsStatsRes.data;
            setSeverityStats({
                critical: ls.errors || 0,
                high: ls.warnings || 0,
                medium: ls.info || 0,
                low: 0
            });
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(() => {
            fetchAnalytics();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const severityPieData = [
        { name: 'Critical', value: severityStats.critical, color: COLORS.critical },
        { name: 'High', value: severityStats.high, color: COLORS.high },
        { name: 'Medium', value: severityStats.medium, color: COLORS.medium },
        { name: 'Low', value: severityStats.low, color: COLORS.low },
    ].filter(d => d.value > 0);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-6 overflow-x-hidden selection:bg-blue-500/30">
            {/* TOP HEADER: TITLE & ACTIONS */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.15)]">
                        <Radar className="w-7 h-7 text-blue-500 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-3">
                            Event <span className="text-blue-500">Explorer</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-1">
                                <Activity className="w-3 h-3 text-emerald-500" /> Real-time Telemetry Processing
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group mr-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Quick global filter..."
                            className="bg-slate-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all w-64 shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* NEW FILTER SYSTEM */}
                    <div className="relative">
                        <button
                            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/5 rounded-xl hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest text-slate-300"
                        >
                            <Database className="w-3.5 h-3.5 text-blue-500" /> Add Filter
                        </button>

                        <AnimatePresence>
                            {filterMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-xl"
                                >
                                    <h4 className="px-3 py-2 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Select Filter Key</h4>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {FILTER_OPTIONS.map(opt => (
                                            <button
                                                key={opt.key}
                                                onClick={() => addFilter(opt)}
                                                className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-blue-600 hover:text-white rounded-xl transition-colors"
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000"></div>
                        <Sparkles className="w-3.5 h-3.5" /> AI Investigate
                    </button>
                    <button
                        onClick={() => { setIsRefreshing(true); fetchEvents(); fetchAnalytics(); }}
                        className="p-2.5 bg-slate-800/50 border border-white/5 rounded-xl hover:text-blue-500 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ACTIVE FILTERS DISPLAY */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-2">Active Filters:</span>
                    {activeFilters.map(f => (
                        <div key={f.key} className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-lg pl-3 pr-1 py-1">
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">{f.label}:</span>
                            <span className="text-[10px] font-bold text-white">{f.value}</span>
                            <button
                                onClick={() => removeFilter(f.key)}
                                className="p-1 hover:text-red-400 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3 rotate-45" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setActiveFilters([])}
                        className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest ml-4 underline underline-offset-4"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* CORRELATION ENGINE STATUS BAR */}
            <div className="bg-[#0f172a] border border-white/5 rounded-2xl px-6 py-3 mb-8 flex items-center justify-between shadow-2xl backdrop-blur-3xl">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Correlation Engine Active</span>
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Intelligence Sync</span>
                        <div className="flex items-center gap-3">
                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${syncStatus}%` }}
                                    className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                                />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-blue-400">{syncStatus}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Monitored Events</span>
                        <span className="text-sm font-mono font-bold text-white">{totalEvents.toLocaleString()}</span>
                    </div>
                    <Cpu className="w-5 h-5 text-slate-700" />
                </div>
            </div>

            {/* ANALYTICAL HEADER GRID (4 CHARTS) */}
            <div className="grid grid-cols-12 gap-6 mb-8">
                {/* 1. EVENT DISTRIBUTION */}
                <div className="col-span-12 md:col-span-3 bg-[#0f172a]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl group hover:border-blue-500/20 transition-all">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-500" /> Event Distribution
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="hour" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#3b82f6', fontSize: '10px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="critical" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="high" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="medium" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="low" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. SECURITY INCIDENT TIMELINE */}
                <div className="col-span-12 md:col-span-4 bg-[#0f172a]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl group hover:border-amber-500/20 transition-all">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Security Incident Timeline
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="hour" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    labelStyle={{ color: '#fff', fontSize: '10px' }}
                                />
                                <Area type="monotone" dataKey="critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorTrend)" strokeWidth={2} />
                                <Area type="monotone" dataKey="high" stroke="#f97316" fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. TOP SOURCE NATIONS (Static/Cached Labels) */}
                <div className="col-span-12 md:col-span-3 bg-[#0f172a]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl group hover:border-emerald-500/20 transition-all">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-emerald-500" /> Top Source Nations
                    </h3>
                    <div className="h-48 space-y-3 px-2 flex flex-col justify-center">
                        {[
                            { name: 'USA', val: 85 }, { name: 'CAN', val: 64 },
                            { name: 'GBR', val: 42 }, { name: 'DEU', val: 38 },
                            { name: 'FRA', val: 24 }
                        ].map((loc, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-[9px] font-mono font-black text-slate-500 w-8">{loc.name}</span>
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${loc.val}%` }}
                                        className="h-full bg-emerald-500/40"
                                    />
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-400">{loc.val}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. LOG SEVERITY RATIO */}
                <div className="col-span-12 md:col-span-2 bg-[#0f172a]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl group hover:border-rose-500/20 transition-all">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Severity Ratio
                    </h3>
                    <div className="h-48 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={severityPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {severityPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* MAIN LOG TABLE AREA */}
            <div className="bg-[#0f172a]/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                        <span className="text-xs font-black uppercase tracking-widest">Querying Logic Engines...</span>
                    </div>
                ) : (
                    <div className="relative">
                        <LogTable logs={events} />

                        {/* Custom Pagination Overlay for dark theme look */}
                        <div className="p-6 border-t border-white/5 flex justify-between items-center bg-black/20">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                DISPLAYING {events.length} OF {totalEvents.toLocaleString()} EVENTS
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1 px-3 bg-slate-800 rounded-lg text-[10px] font-black hover:bg-slate-700 disabled:opacity-20"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] font-mono font-bold text-blue-500 px-4">PAGE {page}</span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-1 px-3 bg-slate-800 rounded-lg text-[10px] font-black hover:bg-slate-700 disabled:opacity-20"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            ` }} />
        </div>
    );
};

export default EventExplorer;
