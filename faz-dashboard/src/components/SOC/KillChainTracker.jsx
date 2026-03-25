import React from 'react';

const KillChainTracker = ({ data }) => {
    const getStatusColor = (status) => {
        if (status === 'detected') return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
        if (status === 'active') return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse';
        if (status === 'predicted') return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
        return 'bg-slate-700';
    };

    return (
        <div className="space-y-3">
            {data.stages.map((stage, idx) => (
                <div key={idx} className="relative">
                    <div className="flex items-center gap-3">
                        {/* Status Indicator */}
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(stage.status)}`} />

                        {/* Stage Info */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-white uppercase tracking-wide">
                                    {stage.stage}
                                </span>
                                {stage.confidence > 0 && (
                                    <span className="text-[8px] font-mono text-slate-400">
                                        {stage.confidence}% confidence
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {stage.status !== 'none' && (
                                <div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getStatusColor(stage.status).split(' ')[0]} transition-all duration-500`}
                                        style={{ width: `${stage.confidence}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Event Count */}
                        {stage.count > 0 && (
                            <span className="text-[9px] font-black text-slate-600 min-w-[30px] text-right">
                                {stage.count} evt
                            </span>
                        )}
                    </div>

                    {/* Connector Line */}
                    {idx < data.stages.length - 1 && (
                        <div className="absolute left-[3px] top-6 w-[2px] h-4 bg-white/5" />
                    )}
                </div>
            ))}
        </div>
    );
};

export default KillChainTracker;
