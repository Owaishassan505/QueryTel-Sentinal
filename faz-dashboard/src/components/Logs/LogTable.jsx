import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Info,
    XCircle,
    Shield,
    ChevronLeft,
    Globe,
    Lock,
    UserX,
    Server,
    Clock,
    MousePointer2,
    Ticket,
    ShieldCheck,
    HelpCircle,
    Cpu,
    Target,
    ShieldAlert,
    Activity,
    Terminal,
    Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { apiFetch } from '../../api/api';
import { analyzeLog } from '../../utils/SmartLogAnalyzer';

const getCategoryIcon = (category) => {
    const c = String(category || '').toLowerCase();
    if (c.includes('dns')) return <Globe className="w-4 h-4 text-blue-400" />;
    if (c.includes('ips') || c.includes('antivirus')) return <ShieldAlert className="w-4 h-4 text-red-400" />;
    if (c.includes('ssl') || c.includes('vpn')) return <Lock className="w-4 h-4 text-emerald-400" />;
    if (c.includes('login')) return <UserX className="w-4 h-4 text-orange-400" />;
    if (c.includes('app')) return <Activity className="w-4 h-4 text-purple-400" />;
    return <Server className="w-4 h-4 text-slate-400" />;
};

const getSeverityStyles = (severity) => {
    const s = String(severity || '').toLowerCase();
    if (s.includes('error') || s.includes('crit')) return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-400',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.1)]',
        indicator: 'bg-red-500'
    };
    if (s.includes('warn')) return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-400',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]',
        indicator: 'bg-amber-500'
    };
    return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]',
        indicator: 'bg-blue-500'
    };
};


const ZohoTicketButton = ({ log }) => {
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState(false);

    const createTicket = async (e) => {
        e.stopPropagation();
        if (loading || created) return;

        setLoading(true);
        try {
            const description = `
SOC Incident Report
-------------------
Log ID: ${log._id || 'N/A'}
Timestamp: ${new Date(log.ts || log.timestamp).toLocaleString()}
Severity: ${log.severity}
Device: ${log.deviceName || log.devname || 'Unknown'}
Source: ${log.sourceIp || log.srcip || 'N/A'}
Destination: ${log.destIp || log.dstip || 'N/A'}
Action: ${log.action || 'N/A'}
Message: ${log.humanMessage || log.message || 'No message provided'}
            `.trim();

            const { ok } = await apiFetch("/api/zoho/tickets", {
                method: "POST",
                body: JSON.stringify({
                    userName: "SOC Automations",
                    userEmail: "soc@querytel.com",
                    issueDescription: description
                })
            });

            if (ok) {
                setCreated(true);
                setTimeout(() => setCreated(false), 3000);
            }
        } catch (err) {
            console.error("Failed to create Zoho ticket", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={createTicket}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black uppercase tracking-widest ${created
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20 hover:border-blue-500/40'
                }`}
            disabled={loading || created}
        >
            {loading ? (
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            ) : created ? (
                <>
                    <ShieldCheck className="w-3 h-3" />
                    Ticket Created
                </>
            ) : (
                <>
                    <Ticket className="w-3 h-3" />
                    Zoho Ticket
                </>
            )}
        </button>
    );
};

const LogRow = ({ log }) => {
    const [expanded, setExpanded] = useState(false);
    const styles = getSeverityStyles(log.severity);
    const translation = analyzeLog(log);

    const timestamp = log.ts || log.timestamp || log.devtime || log.date;
    const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A';

    return (
        <div className="mb-1">
            <motion.div
                layout
                onClick={() => setExpanded(!expanded)}
                className={`group relative flex items-center gap-3 py-2 px-3 rounded-lg border transition-all cursor-pointer bg-[#0f172a]/40 backdrop-blur-md hover:bg-[#1e293b] ${expanded ? 'border-primary/50 bg-[#1e293b]' : 'border-white/5'}`}
            >
                {/* Severity Left Bar */}
                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${styles.indicator}`}></div>

                <div className="flex items-center gap-3 min-w-[120px]">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                        {timeStr}
                    </span>
                </div>

                <div className="flex items-center gap-2 min-w-[80px]">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-800/50 ${styles.text}`}>
                        {log.severity || 'INFO'}
                    </div>
                </div>

                <div className="flex items-center gap-2 min-w-[120px]">
                    {getCategoryIcon(log.category)}
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                        {log.category || 'General'}
                    </span>
                </div>

                <div className="flex items-center gap-2 min-w-[120px]">
                    <MousePointer2 className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">
                        {log.sourceIp || log.srcip || 'Internal'}
                    </span>
                </div>

                <div className="flex items-center gap-2 min-w-[120px] hidden lg:flex">
                    <Target className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">
                        {log.destIp || log.dstip || 'N/A'}
                    </span>
                </div>

                <div className="flex-1 truncate">
                    <span className="text-xs text-slate-400 font-medium group-hover:text-slate-200 transition-colors">
                        {translation.what}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <ZohoTicketButton log={log} />
                    <div className="text-slate-500 ml-2">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 p-6 rounded-2xl border border-slate-800 bg-[#0f172b]/80 backdrop-blur-xl shadow-2xl ml-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {/* Section 1: What & Why */}
                                <div className="md:col-span-2 space-y-4">
                                    <div>
                                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Eye className="w-3 h-3" /> WHAT HAPPENED
                                        </h4>
                                        <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                            {translation.what}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Info className="w-3 h-3" /> WHY IT HAPPENED
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed italic">
                                            {translation.why}
                                        </p>
                                    </div>
                                </div>

                                {/* Section 2: Risk Assessment */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">IS THIS A THREAT?</h4>
                                        <div className={`text-lg font-black ${translation.riskColor} flex items-center gap-2 uppercase italic`}>
                                            <Shield className="w-5 h-5" />
                                            {translation.isThreat}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 uppercase">ACTION REQUIRED</h4>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200">
                                            <Activity className="w-3 h-3 text-red-400" />
                                            {translation.action}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Tech Info */}
                                <div className="space-y-4 border-l border-slate-800 pl-6">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">TECH SPECS</h4>
                                    <div className="space-y-1.5 font-mono text-[10px]">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Device:</span>
                                            <span className="text-slate-300 font-bold">{log.deviceName || log.devname || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Service:</span>
                                            <span className="text-slate-200 font-bold">{log.service || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Source:</span>
                                            <span className="text-blue-400 font-bold">{(log.sourceIp && log.sourceIp !== 'Unknown Source') ? log.sourceIp : (log.srcip || log.remip || log.parsed?.remip || log.parsed?.srcip || log.parsed?.src || 'Internal')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Destination:</span>
                                            <span className="text-indigo-400 font-bold">{(log.destIp && log.destIp !== 'Unknown Destination') ? log.destIp : (log.destIp || log.dstip || log.dst_host || log.hostname || log.parsed?.hostname || log.parsed?.dstip || log.parsed?.dst || 'N/A')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Port:</span>
                                            <span className="text-slate-200 font-bold">{log.dstPort || log.dstport || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Action:</span>
                                            <span className={`font-bold ${log.action?.includes('deny') || log.action?.includes('block') ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {log.action || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-800 mt-2 pt-2">
                                            <span className="text-slate-500">Policy ID:</span>
                                            <span className="text-slate-300 font-bold">{log.policyId || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Raw Details */}
                            <div className="mt-6 pt-6 border-t border-slate-800">
                                <details className="group">
                                    <summary className="text-[10px] font-black text-slate-600 uppercase cursor-pointer hover:text-blue-500 transition-colors list-none flex items-center gap-2">
                                        <Terminal className="w-3 h-3" /> TECHNICAL DETAILS (RAW DATA)
                                    </summary>
                                    <pre className="mt-4 p-4 rounded-xl bg-black/40 border border-slate-800/50 text-[10px] text-emerald-400/80 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                                        {JSON.stringify(log.parsed || log, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LogTable = ({ logs }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('all');

    const pageSize = 10;

    // Filtering logic
    const filteredLogs = logs.filter(log => {
        const matchesSearch = !search ||
            (log.sourceIp || '').includes(search) ||
            (log.destIp || '').includes(search) ||
            (log.message || '').toLowerCase().includes(search.toLowerCase());

        const matchesSeverity = filterSeverity === 'all' ||
            (log.severity || '').toLowerCase().includes(filterSeverity.toLowerCase());

        return matchesSearch && matchesSeverity;
    });

    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

    const handlePrev = () => setCurrentPage(prev => Math.max(1, prev - 1));
    const handleNext = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

    return (
        <div className="flex flex-col h-full bg-[#0a0c10] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {/* Header / Filter Bar */}
            <div className="px-8 py-6 border-b border-slate-800 bg-[#0f172a]/40 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="font-black text-slate-100 flex items-center gap-3 text-base italic tracking-tighter uppercase">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse ring-4 ring-blue-500/20"></div>
                        Live SOC Stream
                    </h3>
                    <div className="h-4 w-px bg-slate-800"></div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">
                        Synchronized with Network Perimeter
                    </span>
                </div>
            </div>

            {/* List View */}
            <div className="flex-1 overflow-auto p-4 custom-scrollbar min-h-[500px]">
                <div className="max-w-7xl mx-auto py-4">
                    {currentLogs.map((log, idx) => (
                        <LogRow key={log.id || idx} log={log} />
                    ))}

                    {currentLogs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
                            <Activity className="w-12 h-12 text-blue-500/20 animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                Monitoring Stream... No Matches Found
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Pager */}
            <div className="px-8 py-4 border-t border-slate-800 bg-black/20 flex items-center justify-between">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-4">
                    <span>Audit Entries: {totalItems}</span>
                    <div className="h-3 w-px bg-slate-800"></div>
                    <span className="text-slate-400">Ingress Active: OK</span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-800 bg-[#0f172a] text-slate-400 disabled:opacity-20 hover:text-blue-500 transition-all shadow-lg"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-[11px] font-mono font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-xl min-w-[70px] text-center">
                        {currentPage} / {totalPages || 1}
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={currentPage >= totalPages}
                        className="p-2 rounded-xl border border-slate-800 bg-[#0f172a] text-slate-400 disabled:opacity-20 hover:text-blue-500 transition-all shadow-lg"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogTable;
