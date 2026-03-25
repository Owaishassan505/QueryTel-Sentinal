import React from 'react';
import { X, Activity, Terminal, AlertCircle } from 'lucide-react';
import LogTable from '../Logs/LogTable';

const LogModal = ({ isOpen, onClose, title, logs, loading, icon: Icon = Activity, color = 'blue' }) => {
    if (!isOpen) return null;

    const colorStyles = {
        blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400' },
        red: { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
        amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
        emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
        indigo: { border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
        orange: { border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400' },
        purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    };

    const styles = colorStyles[color] || colorStyles.blue;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-6xl max-h-[85vh] bg-[#0a0c10] border ${styles.border} rounded-[2rem] shadow-2xl flex flex-col overflow-hidden`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-8 py-5 border-b border-white/5 ${styles.bg}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${styles.bg} border ${styles.border}`}>
                            <Icon className={`w-5 h-5 ${styles.text}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase italic tracking-wide">{title}</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                {loading ? 'Loading...' : `${logs.length} Records Found`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                            <div className={`w-10 h-10 border-4 ${styles.border} border-t-transparent rounded-full animate-spin mb-4`}></div>
                            <p className="text-xs font-black uppercase tracking-widest">Fetching Log Stream...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                            <Terminal className="w-12 h-12 mb-4 opacity-30" />
                            <p className="text-xs font-black uppercase tracking-widest">No Records Found</p>
                        </div>
                    ) : (
                        <LogTable logs={logs} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogModal;
