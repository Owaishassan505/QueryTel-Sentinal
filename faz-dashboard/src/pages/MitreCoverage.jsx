import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Shield,
    AlertTriangle,
    Info,
    Target,
    Calendar,
    ChevronRight,
    X,
    ExternalLink,
    Search,
    Filter
} from 'lucide-react';
import { backendURL } from '../config';

const MitreCoverage = () => {
    const [matrix, setMatrix] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTech, setSelectedTech] = useState(null);
    const [techDetails, setTechDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchMatrix = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendURL}/api/soc/mitre-matrix`);
            setMatrix(res.data);
        } catch (err) {
            console.error('Error fetching MITRE matrix:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTechDetails = async (id) => {
        setLoadingDetails(true);
        try {
            const res = await axios.get(`${backendURL}/api/soc/mitre-technique/${id}`);
            setTechDetails(res.data);
        } catch (err) {
            console.error('Error fetching technique details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        fetchMatrix();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Covered': return 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30';
            case 'Partial': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30';
            case 'Not Covered': return 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30';
            default: return 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800/80';
        }
    };

    // Group coverage by tactic
    const groupedMatrix = matrix.reduce((acc, item) => {
        if (!acc[item.tactic]) acc[item.tactic] = [];
        acc[item.tactic].push(item);
        return acc;
    }, {});

    const tactics = Object.keys(groupedMatrix);

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-slate-200">
            {/* Header */}
            <header className="p-6 border-b border-white/5 bg-[#0f0f12]/80 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                            <Shield className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">MITRE ATT&CK Coverage</h1>
                            <p className="text-sm text-slate-400 font-medium">Real-time detection posture & gap analysis</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-900/50 border border-white/5 rounded-lg p-1 text-[10px] font-bold uppercase tracking-widest">
                            <div className="px-3 py-1 flex items-center gap-2 border-r border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                <span className="text-blue-300">Covered</span>
                            </div>
                            <div className="px-3 py-1 flex items-center gap-2 border-r border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                                <span className="text-yellow-300">Partial</span>
                            </div>
                            <div className="px-3 py-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                                <span className="text-red-300">Gaps</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {loading ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-400 font-medium animate-pulse">Calculating coverage from live log stream...</p>
                    </div>
                ) : (
                    <div className="flex gap-6 items-start">
                        {/* Matrix Grid */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {tactics.map(tactic => (
                                <div key={tactic} className="space-y-3">
                                    <div className="px-2 pb-1 border-b border-white/10 uppercase text-[10px] font-bold text-slate-400 tracking-[0.2em] flex items-center justify-between">
                                        <span>{tactic}</span>
                                        <Target className="w-3 h-3 opacity-50" />
                                    </div>
                                    <div className="space-y-2">
                                        {groupedMatrix[tactic].map(tech => (
                                            <button
                                                key={tech.technique_id}
                                                onClick={() => {
                                                    setSelectedTech(tech);
                                                    fetchTechDetails(tech.technique_id);
                                                }}
                                                className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all duration-300 group relative overflow-hidden ${getStatusColor(tech.coverage_status)}`}
                                            >
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <span className="opacity-60 font-mono text-[9px]">{tech.technique_id}</span>
                                                    {tech.detection_count > 0 && (
                                                        <span className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded-full border border-white/5">
                                                            {tech.detection_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="line-clamp-2 pr-4">{tech.technique_name}</div>
                                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Side Panel (Details) */}
                        {selectedTech && (
                            <div className="w-96 bg-[#0f0f12] border border-white/10 rounded-2xl p-6 sticky top-28 shadow-2xl animate-in slide-in-from-right duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">{selectedTech.tactic}</div>
                                        <h2 className="text-xl font-bold text-white leading-tight">{selectedTech.technique_name}</h2>
                                        <div className="font-mono text-xs text-slate-500 mt-1">{selectedTech.technique_id}</div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedTech(null)}
                                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Status Card */}
                                    <div className={`p-4 rounded-xl border ${getStatusColor(selectedTech.coverage_status)}`}>
                                        <div className="text-[10px] uppercase font-bold opacity-60 mb-2">Coverage Status</div>
                                        <div className="text-base font-bold flex items-center gap-2">
                                            {selectedTech.coverage_status}
                                            {selectedTech.coverage_status === 'Covered' && <Target className="w-4 h-4" />}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Detections</div>
                                            <div className="text-lg font-bold text-white">{selectedTech.detection_count}</div>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Last Seen</div>
                                            <div className="text-xs font-bold text-white">
                                                {selectedTech.last_detected ? new Date(selectedTech.last_detected).toLocaleDateString() : 'Never'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Events */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recent Related Events</h3>
                                            <span className="text-[9px] text-slate-500">Last 30 Days</span>
                                        </div>
                                        {loadingDetails ? (
                                            <div className="py-8 flex justify-center">
                                                <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                            </div>
                                        ) : techDetails?.recentEvents?.length > 0 ? (
                                            <div className="space-y-2">
                                                {techDetails.recentEvents.map((ev, idx) => (
                                                    <div key={ev._id || idx} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 group">
                                                        <div className="text-[10px] font-mono text-indigo-300 mb-1">{ev.sourceIp} → {ev.destIp}</div>
                                                        <div className="text-[11px] text-white font-medium line-clamp-1 group-hover:line-clamp-none transition-all">
                                                            {ev.cleanMessage || ev.message}
                                                        </div>
                                                        <div className="flex justify-between items-center mt-2 opacity-60 text-[9px]">
                                                            <span>{new Date(ev.ts).toLocaleString()}</span>
                                                            <span className="uppercase">{ev.service}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6 text-center">
                                                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2 opacity-50" />
                                                <div className="text-xs text-red-300 font-medium">Detection Gap Identified</div>
                                                <p className="text-[10px] text-slate-500 mt-1">No events matched this technique in your current log environment.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* External Reference */}
                                    <a
                                        href={`https://attack.mitre.org/techniques/${selectedTech.technique_id}`}
                                        target="_blank"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/20 transition-all"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        View on MITRE Portal
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MitreCoverage;
