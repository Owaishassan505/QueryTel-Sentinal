import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import {
    Radio, Activity, ShieldAlert, Zap, Globe, MessageSquare,
    ChevronRight, AlertTriangle, Cpu, TrendingUp, Hash,
    Terminal, Clock, Share2, Info, Disc, Instagram, Lock, ExternalLink,
    RefreshCw, Fingerprint
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { backendURL } from "../config";

// --- Custom Components ---

const StatusBadge = ({ value, type }) => {
  let colors = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (type === "confidence") {
    if (value > 70) colors = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    else if (value > 40) colors = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    else colors = "bg-slate-500/10 text-slate-400 border-slate-500/20";
  } else if (type === "impact") {
    if (value > 60) colors = "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
    else if (value > 30) colors = "bg-orange-500/10 text-orange-400 border-orange-500/20";
    else colors = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors} backdrop-blur-sm`}>
      {type}: {value}{type === "confidence" ? "%" : ""}
    </span>
  );
};

const PlatformIcon = ({ platform }) => {
  const p = platform.toLowerCase();
  if (p.includes("telegram")) return <MessageSquare className="w-4 h-4 text-sky-400" />;
  if (p.includes("discord")) return <Disc className="w-4 h-4 text-indigo-400" />;
  if (p.includes("onion")) return <Globe className="w-4 h-4 text-emerald-400" />;
  if (p.includes("forum") || p.includes("xss") || p.includes("breach")) return <Terminal className="w-4 h-4 text-purple-400" />;
  return <Hash className="w-4 h-4 text-slate-400" />;
};

const StatBlock = ({ title, value, sub, icon: Icon, color = "blue" }) => (
  <div className="bg-[#0f172a]/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-${color}-500/10 transition-colors`}></div>
    <div className="flex items-center justify-between mb-3 relative z-10">
      <div className={`p-2 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-${color}-400`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{title}</span>
    </div>
    <div className="relative z-10">
      <div className="text-3xl font-black text-white font-mono tracking-tighter leading-none mb-1">
        {value}
      </div>
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{sub}</div>
    </div>
  </div>
);

// --- Main Page ---

export default function EarlyWarning() {
  const [rumors, setRumors] = useState([]);
  const [stats, setStats] = useState({ stats: [], distribution: [] });
  const [analysis, setAnalysis] = useState({ 
    summary: "", 
    prediction: "48-72 Hours", 
    signalStrength: 0,
    recommendations: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedRumorId, setExpandedRumorId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchData = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [rumorsRes, statsRes, analysisRes] = await Promise.all([
        axios.get(`${backendURL}/api/threat/rumors`, config),
        axios.get(`${backendURL}/api/threat/stats`, config),
        axios.get(`${backendURL}/api/threat/analysis`, config)
      ]);
      
      setRumors(rumorsRes.data);
      setStats(statsRes.data);
      setAnalysis(analysisRes.data);
    } catch (err) {
      console.error("Early Warning Data Error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();

    const socket = io(backendURL, {
      auth: { token },
      transports: ["websocket"]
    });

    socket.on("threat:rumor", (newRumor) => {
      setRumors(prev => [newRumor, ...prev.slice(0, 49)]);
      // Update stats locally or re-fetch
      setStats(prev => ({
        ...prev,
        stats: [...prev.stats.slice(1), {
          time: new Date(newRumor.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          intensity: newRumor.impactScore,
          confidence: newRumor.confidence
        }]
      }));
    });

    return () => socket.disconnect();
  }, [fetchData, token]);

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Syncing Tactical Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            <Radio className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              Threat Early Warning
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded italic not-uppercase tracking-normal font-bold">PRE-BREACH</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
              <Activity className="w-3 h-3 text-blue-500" /> Signal Intelligence Hub · Tactical Monitoring
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-[#0f172a] border border-slate-800 p-2 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OSINT Engine Online</span>
        </div>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock title="Signal Intensity" value={`${analysis.signalStrength}%`} sub="Active Chatter Volume" icon={Zap} color="blue" />
        <StatBlock title="Potential Window" value={analysis.prediction.includes(':') ? analysis.prediction.split(': ')[1] : analysis.prediction} sub="Estimated Timeframe" icon={Clock} color="orange" />
        <StatBlock title="Active Rumors" value={rumors.length} sub="Last 24 Hours" icon={MessageSquare} color="purple" />
        <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Cpu className="w-3.5 h-3.5" /> Intelligence Analysis
          </div>
          <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic line-clamp-3">
            "{analysis.summary}"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Charts */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Signal Intensity Timeline */}
          <div className="bg-[#0f172a]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2 italic">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Threat Signal Persistence
              </h2>
              <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Intensity</div>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Confidence</div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="intensityColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="confidenceColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="intensity" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#intensityColor)" />
                  <Area type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#confidenceColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Intelligence Feed */}
          <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h2 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2 italic">
                <MessageSquare className="w-4 h-4 text-purple-500" /> Pre-Breach Chatter Feed
              </h2>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Real-time Stream</span>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {rumors.length === 0 ? (
                  <div className="py-20 text-center opacity-30 italic text-slate-500 uppercase text-[10px] tracking-widest">
                    Waiting for threat signals...
                  </div>
                ) : (
                  rumors.map((r, idx) => (
                    <motion.div
                      key={r._id || idx}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                        onClick={() => setExpandedRumorId(expandedRumorId === r._id ? null : r._id)}
                        className={`p-5 border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors group relative cursor-pointer ${expandedRumorId === r._id ? 'bg-white/[0.03]' : ''}`}
                      >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <PlatformIcon platform={r.platform} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                              {r.platform}
                              <span className="text-slate-600">/</span>
                              <span className="text-slate-500 tracking-normal capitalize">{r.source}</span>
                            </span>
                            <span className="text-[9px] font-mono font-bold text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-200 text-xs font-medium leading-relaxed mb-3">
                            {r.rumor}
                          </p>
                          <div className="flex items-center gap-3">
                            <StatusBadge value={r.impactScore} type="impact" />
                            <StatusBadge value={r.confidence} type="confidence" />
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                           <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-white transition-all">
                             <Share2 className="w-4 h-4" />
                           </button>
                           <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${expandedRumorId === r._id ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                      
                      {expandedRumorId === r._id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-4 pt-4 border-t border-slate-800/50"
                        >
                          <div className="flex items-center justify-between bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 backdrop-blur-sm">
                            <div className="min-w-0 pr-4">
                              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-1">Source Reference / Link</span>
                              <code className="text-[10px] text-slate-400 font-mono break-all">{r.reference || 'Source Trace Encrypted/N/A'}</code>
                            </div>
                            {r.reference && r.reference.startsWith('http') && (
                              <a 
                                href={r.reference} 
                                target="_blank" 
                                rel="noreferrer" 
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shrink-0"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Priority highlight for high impact */}
                      {r.impactScore > 60 && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* RIGHT: Platform Distribution & Analysis */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Platform Distribution */}
          <div className="bg-[#0f172a]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
            <h2 className="text-sm font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-2 italic">
              <Globe className="w-4 h-4 text-emerald-500" /> Platform Hotspots
            </h2>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.distribution} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {stats.distribution.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations / Tactical Steps */}
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] p-6 rounded-[2rem] border border-blue-500/20 shadow-2xl space-y-6">
            <h2 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2 italic">
              <ShieldAlert className="w-4 h-4 text-blue-400" /> Tactical Advisory
            </h2>
            
            <div className="space-y-4">
              {analysis.recommendations && analysis.recommendations.length > 0 ? (
                analysis.recommendations.map((step, i) => {
                  const Icons = { Lock, Activity, Info, ShieldAlert, Fingerprint, RefreshCw, Globe };
                  const Icon = Icons[step.icon] || Info;
                  return (
                    <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{step.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{step.desc}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-[10px] text-slate-500 italic uppercase tracking-widest">
                  Calculating Tactical Steps...
                </div>
              )}
            </div>

            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
              Launch Full Investigation <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Neural Alert */}
          <div className="p-1 rounded-[2rem] bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="bg-[#0f172a] rounded-[1.9rem] p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Confidence Projection</h3>
              <p className="text-2xl font-black text-white font-mono tracking-tighter leading-none mb-4">
                {Math.floor(analysis.signalStrength * 1.2)}%
              </p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(analysis.signalStrength * 1.2, 100)}%` }} 
                  className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                />
              </div>
              <p className="text-[9px] text-slate-600 mt-4 font-bold uppercase italic">Threat Persistence is CURRENTLY STABLE</p>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}
