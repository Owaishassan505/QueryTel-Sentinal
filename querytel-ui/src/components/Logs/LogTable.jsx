import React, { useState } from 'react';
import {
    Clock,
    ShieldAlert,
    Globe,
    Lock,
    Activity,
    Server,
    MousePointer2,
    Target,
    Terminal,
    ChevronDown,
    ChevronRight,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LogRow = ({ log }) => {
    const [expanded, setExpanded] = useState(false);
    const severity = (log.severity || 'Info').toLowerCase();

    const getStyles = () => {
        if (severity.includes('error') || severity.includes('critical')) return { text: 'text-red-400', bg: 'bg-red-500/10', indicator: 'bg-red-500' };
        if (severity.includes('warning')) return { text: 'text-amber-400', bg: 'bg-amber-500/10', indicator: 'bg-amber-500' };
        return { text: 'text-blue-400', bg: 'bg-blue-500/10', indicator: 'bg-blue-500' };
    };

    const styles = getStyles();
    const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A';

    return (
        <div className="mb-1">
            <motion.div
                layout
                onClick={() => setExpanded(!expanded)}
                className={`group relative flex items-center gap-3 py-2.5 px-4 rounded-xl border transition-all cursor-pointer bg-[#0f172a]/40 backdrop-blur-md hover:bg-[#1e293b] ${expanded ? 'border-blue-500/30 bg-[#1e293b]' : 'border-white/5'}`}
            >
                {/* Active Indicator */}
                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${styles.indicator}`}></div>

                <div className="flex items-center gap-3 min-w-[100px]">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                        {time}
                    </span>
                </div>

                <div className="flex items-center gap-2 min-w-[80px]">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-800/50 ${styles.text}`}>
                        {log.severity || 'INFO'}
                    </div>
                </div>

                <div className="flex items-center gap-2 min-w-[120px]">
                    <Server className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                        {log.category || 'General'}
                    </span>
                </div>

                <div className="flex items-center gap-2 min-w-[120px]">
                    <MousePointer2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">
                        {log.source || 'Internal'}
                    </span>
                </div>

                <div className="flex items-center gap-2 min-w-[120px] hidden xl:flex">
                    <Target className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">
                        {log.destination || 'N/A'}
                    </span>
                </div>

                <div className="flex-1 truncate">
                    <span className="text-[11px] text-slate-400 font-medium group-hover:text-slate-200 transition-colors">
                        {log.message}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-slate-600 group-hover:text-white transition-colors">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-1 p-4 rounded-xl bg-slate-900/60 border border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Technical Specs</h4>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-slate-300"><span className="text-slate-500">Service:</span> {log.category}</p>
                                    <p className="text-[10px] font-mono text-slate-300"><span className="text-slate-500">Port:</span> {log.port || '443'}</p>
                                    <p className="text-[10px] font-mono text-slate-300"><span className="text-slate-500">Action:</span> <span className="text-emerald-500 uppercase">Allowed</span></p>
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Human Narrative</h4>
                                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                                    "A packet matching security profile '{log.category}' was processed on node TORONTO-DC-01. Source identity {log.source} initiated a session to {log.destination}. Policy engine verified signature and authorized egress."
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LogTable = ({ logs }) => {
    return (
        <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-full flex flex-col">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
                    <h2 className="text-sm font-black text-white uppercase italic tracking-widest">Tactical Audit Matrix</h2>
                    <div className="h-4 w-px bg-white/10"></div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] animate-pulse">Live Periphery Stream</span>
                </div>
                <div className="flex items-center gap-5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-blue-500/50 transition-all">
                        <Search className="w-3 h-3 mr-2" />
                        <input type="text" placeholder="Filter stream..." className="bg-transparent border-none outline-none text-[10px] w-32 placeholder:text-slate-700" />
                    </div>
                </div>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Terminal className="w-16 h-16 animate-pulse mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Awaiting Data Ingress...</p>
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <LogRow key={log.id || i} log={log} />
                    ))
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
            ` }} />
        </div>
    );
};

export default LogTable;
