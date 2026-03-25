import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    ShieldAlert, AlertTriangle, Users, HardDrive,
    Plug, LayoutGrid, Clock, Target,
    TrendingUp, Shield, Activity, Search,
    ChevronDown, Filter, Maximize2, MoreVertical
} from "lucide-react";
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip,
    BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { backendURL } from "../config";

const KPICard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white border border-slate-200 p-4 flex flex-col items-center justify-center text-center group hover:bg-slate-50 transition-colors cursor-pointer border-r last:border-r-0">
        <span className={`text-4xl font-light mb-2 ${color}`}>{value}</span>
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
);

const MovingFlowSankey = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Process nodes
    const sources = [...new Set(data.map(d => d.source))].sort();
    const targets = [...new Set(data.map(d => d.target))].sort((a, b) => {
        const valA = data.filter(d => d.target === a).reduce((sum, d) => sum + d.value, 0);
        const valB = data.filter(d => d.target === b).reduce((sum, d) => sum + d.value, 0);
        return valB - valA;
    }).slice(0, 5); // Top 5 targets

    const totalValue = data.reduce((sum, d) => sum + d.value, 0);

    const colors = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#f59e0b',
        low: '#3b82f6',
        unknown: '#94a3b8'
    };

    const nodeHeight = 40;
    const gap = 12;
    const width = 650; // Increased width to prevent overlap
    const height = (Math.max(sources.length, targets.length) * (nodeHeight + gap));

    return (
        <div className="flex-1 p-2 flex flex-col relative overflow-hidden bg-white">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    {sources.map(s => (
                        <linearGradient key={`grad-${s}`} id={`grad-${s}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={colors[s.toLowerCase()] || colors.unknown} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={colors[s.toLowerCase()] || colors.unknown} stopOpacity="0.05" />
                        </linearGradient>
                    ))}
                </defs>

                {/* Render Links with Flows */}
                {data.filter(d => targets.includes(d.target)).map((link, i) => {
                    const sIdx = sources.indexOf(link.source);
                    const tIdx = targets.indexOf(link.target);
                    const sy = sIdx * (nodeHeight + gap) + nodeHeight / 2;
                    const ty = tIdx * (nodeHeight + gap) + nodeHeight / 2;
                    const color = colors[link.source.toLowerCase()] || colors.unknown;

                    const d = `M 120 ${sy} C 250 ${sy}, 250 ${ty}, 380 ${ty}`;

                    return (
                        <g key={`link-${i}`}>
                            <path
                                d={d}
                                fill="none"
                                stroke={color}
                                strokeWidth={Math.max(3, (link.value / totalValue) * 50)}
                                opacity="0.08"
                            />
                            <path
                                d={d}
                                fill="none"
                                stroke={color}
                                strokeWidth={2}
                                strokeDasharray="6 10"
                                style={{
                                    animation: `flow-anim ${Math.max(1, 4 - (link.value / totalValue) * 8)}s linear infinite`
                                }}
                            />
                        </g>
                    );
                })}

                {/* Render Source Nodes */}
                {sources.map((s, i) => (
                    <g key={`source-${i}`} transform={`translate(0, ${i * (nodeHeight + gap)})`}>
                        <rect width="120" height={nodeHeight} fill="#f1f5f9" rx="6" />
                        <text x="60" y={nodeHeight / 2} textAnchor="middle" dominantBaseline="middle" className="text-[11px] font-black uppercase italic tracking-wider fill-slate-600">
                            {s}
                        </text>
                    </g>
                ))}

                {/* Render Target Nodes */}
                {targets.map((t, i) => {
                    const targetTotal = data.filter(d => d.target === t).reduce((sum, d) => sum + d.value, 0);
                    const percentage = totalValue > 0 ? ((targetTotal / totalValue) * 100).toFixed(0) : 0;

                    return (
                        <g key={`target-${i}`} transform={`translate(380, ${i * (nodeHeight + gap)})`}>
                            {/* Target Node Background */}
                            <rect width="160" height={nodeHeight} fill="#f1f5f9" rx="6" />

                            {/* Device Name - Full Visibility */}
                            <text x="10" y={nodeHeight / 2} dominantBaseline="middle" className="text-[10px] font-black uppercase italic tracking-tighter fill-slate-700">
                                {t.length > 20 ? t.substring(0, 18) + "..." : t}
                            </text>

                            {/* Value and Percentage Group - Shifted Right */}
                            <g transform="translate(170, 0)">
                                <text x="50" y={nodeHeight / 2 - 5} textAnchor="end" className="text-[13px] font-black fill-slate-800">{targetTotal.toLocaleString()}</text>
                                <text x="50" y={nodeHeight / 2 + 8} textAnchor="end" className="text-[10px] font-bold fill-slate-400">{percentage}%</text>
                            </g>

                            {/* Activity Bits - Positioned at far right */}
                            <g transform="translate(230, 4)">
                                {[...Array(12)].map((_, bitIdx) => (
                                    <rect
                                        key={bitIdx}
                                        x={(bitIdx % 3) * 5}
                                        y={Math.floor(bitIdx / 3) * 10}
                                        width="4"
                                        height="8"
                                        fill={percentage > 30 ? "#ef4444" : "#3b82f6"}
                                        className="animate-pulse"
                                        style={{ animationDelay: `${Math.random() * 2}s`, opacity: 0.6 }}
                                    />
                                ))}
                            </g>
                        </g>
                    );
                })}
            </svg>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes flow-anim {
                    from { stroke-dashoffset: 100; }
                    to { stroke-dashoffset: 0; }
                }
            ` }} />
        </div>
    );
};

export default function SOCDashboard() {
    const [kpis, setKpis] = useState({
        highSeverityIncidents: 0,
        outbreakAlerts: 0,
        compromisedHosts: 0,
        affectedUsers: 0,
        activeConnectors: 0,
        deviceTypes: 0
    });
    const [topIncidents, setTopIncidents] = useState([]);
    const [connectors, setConnectors] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sankeyData, setSankeyData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [kpiRes, topRes, connRes, trendRes, catRes, sankeyRes] = await Promise.all([
                axios.get(`${backendURL}/api/soc/dashboard/kpis`),
                axios.get(`${backendURL}/api/soc/dashboard/top-incidents`),
                axios.get(`${backendURL}/api/soc/dashboard/connectors`),
                axios.get(`${backendURL}/api/soc/dashboard/events-trend`),
                axios.get(`${backendURL}/api/soc/dashboard/incident-categories`),
                axios.get(`${backendURL}/api/soc/dashboard/sankey`)
            ]);
            setKpis(kpiRes.data);
            setTopIncidents(topRes.data);
            setConnectors(connRes.data);
            setTrendData(trendRes.data);
            setCategories(catRes.data);
            setSankeyData(sankeyRes.data || []);
        } catch (err) {
            console.error("SOC Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#f8fafc]">
                <Activity className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f1f5f9] font-sans text-slate-700">
            {/* TOP BAR / PERIOD SELECTOR */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded cursor-pointer hover:bg-slate-200 transition-colors">
                        <Clock className="w-3.5 h-3.5" />
                        Last 1 Hour
                        <ChevronDown className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                        2026-02-10 12:16:00 - 2026-02-10 13:16:00
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Maximize2 className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                    <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-6 bg-white border-b border-slate-200 shadow-sm">
                <KPICard title="High Severity Incidents" value={kpis.highSeverityIncidents} color="text-blue-500" />
                <KPICard title="Outbreak Alerts" value={kpis.outbreakAlerts} color="text-blue-500" />
                <KPICard title="Compromised Host" value={kpis.compromisedHosts} color="text-blue-500" />
                <KPICard title="Affected Users" value={kpis.affectedUsers} color="text-blue-500" />
                <KPICard title="Active Connector" value={kpis.activeConnectors} color="text-blue-500" />
                <KPICard title="Device Types" value={kpis.deviceTypes} color="text-blue-500" />
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-12 gap-1 p-1 flex-1 overflow-hidden">

                {/* EVENTS MAP (Animated Sankey) */}
                <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Events Map</span>
                    </div>
                    <MovingFlowSankey data={sankeyData} />
                </div>

                {/* INCIDENT CATEGORY */}
                <div className="col-span-12 lg:col-span-3 bg-white border border-slate-200 flex flex-col shadow-sm">
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Incident Category</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={categories.length > 0 ? categories : [{ name: 'Loading', value: 1 }]}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(categories.length > 0 ? categories : [{ name: 'empty' }]).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-xl font-bold text-blue-500">{categories.reduce((a, b) => a + b.value, 0)}</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight text-center">Unauthorized<br />Access</span>
                        </div>
                    </div>
                </div>

                {/* TOP INCIDENTS */}
                <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 flex flex-col shadow-sm">
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Top Incidents</span>
                        <div className="flex items-center border border-slate-200 rounded px-2 py-0.5 bg-white">
                            <Search className="w-3 h-3 text-slate-400 mr-2" />
                            <input type="text" placeholder="Search..." className="text-[10px] outline-none border-none w-20" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead className="sticky top-0 bg-slate-50 text-slate-500 uppercase font-black tracking-tighter border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 border-r border-slate-200">Incidents</th>
                                    <th className="px-3 py-2 border-r border-slate-200">Severity</th>
                                    <th className="px-3 py-2 border-r border-slate-200">Category</th>
                                    <th className="px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {topIncidents.map((incident, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-3 py-2 border-r border-slate-100 truncate max-w-[120px] font-medium">{incident.incident_name}</td>
                                        <td className="px-3 py-2 border-r border-slate-100">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${incident.severity === 'Critical' ? 'bg-red-500 text-white' :
                                                incident.severity === 'High' ? 'bg-orange-500 text-white' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {incident.severity}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 border-r border-slate-100 text-slate-500">{incident.category}</td>
                                        <td className="px-3 py-2 text-slate-400 italic">{incident.status || 'draft'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-2 border-t border-slate-100 text-[10px] font-bold text-slate-400 text-right uppercase italic tracking-widest bg-slate-50/30">
                        {topIncidents.length} Records Found
                    </div>
                </div>

                {/* EVENTS AND INCIDENTS TREND */}
                <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 flex flex-col shadow-sm">
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Events and Incidents</span>
                        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-tighter">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500/50 border border-blue-500 rounded-sm"></div> Logs</div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500/50 border border-red-500 rounded-sm"></div> Security</div>
                        </div>
                    </div>
                    <div className="flex-1 p-2 min-h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="hour" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area
                                    type="monotone"
                                    dataKey="logs"
                                    stroke="#3b82f6"
                                    fill="rgba(59, 130, 246, 0.1)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="security"
                                    stroke="#ef4444"
                                    fill="rgba(239, 68, 68, 0.1)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CONNECTOR HEALTH */}
                <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 flex flex-col shadow-sm">
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connector Health</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 flex-1 items-center">
                        {connectors.map((conn, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center space-y-2 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all">
                                <div className={`relative p-3 rounded-full border-2 ${conn.status === 'online' ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-amber-500 bg-amber-50 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                    } transition-all transform group-hover:scale-110`}>
                                    <Plug className={`w-5 h-5 ${conn.status === 'online' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                    {conn.status === 'online' ? (
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                    ) : (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                                            <span className="text-[8px] text-white font-bold">!</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-700 leading-tight uppercase tracking-tighter truncate max-w-[100px]">{conn.name}</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase italic mt-0.5">{conn.lastSync}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* FOOTER BAR */}
            <div className="bg-white border-t border-slate-200 px-4 py-1.5 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-6">
                    <img src="/fortinet-logo.png" alt="Sentinel" className="h-3 opacity-30 grayscale brightness-0" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">v7.6.4</span>
                </div>
                <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase italic">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        System Healthy
                    </div>
                </div>
            </div>
        </div>
    );
}
