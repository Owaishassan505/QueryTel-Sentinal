import React from 'react';

const StatCard = ({ title, value, colorClass = "bg-blue-500", trend, trendUp = true }) => {
    return (
        <div className="bg-[#0f172a]/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer relative overflow-hidden group shadow-lg">
            {/* Glossy accent */}
            <div className={`absolute top-0 left-0 w-full h-0.5 opacity-50 ${colorClass}`}></div>

            <div className="flex justify-between items-start mb-2">
                <h3 className="text-slate-500 text-[9px] font-black uppercase tracking-[0.15em]">{title}</h3>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend}
                    </div>
                )}
            </div>

            <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-100 tabular-nums tracking-tighter group-hover:text-white transition-colors">
                    {(value || 0).toLocaleString()}
                </span>
                <div className={`w-1 h-3 rounded-full mb-1 ${colorClass} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
            </div>

            {/* Background decoration */}
            <div className={`absolute -right-2 -bottom-2 w-12 h-12 rounded-full blur-2xl opacity-10 ${colorClass}`}></div>
        </div>
    );
};

export default StatCard;
