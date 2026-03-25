import React from 'react';

const StatCard = ({ title, value, colorClass = "bg-blue-500", trend, trendUp = true }) => {
    return (
        <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 hover:border-blue-500/20 transition-all cursor-pointer relative overflow-hidden group shadow-2xl">
            {/* Glossy accent */}
            <div className={`absolute top-0 left-0 w-full h-0.5 opacity-30 group-hover:opacity-100 transition-opacity ${colorClass}`}></div>

            <div className="flex justify-between items-start mb-2">
                <h3 className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] italic">{title}</h3>
                {trend && (
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {trend}
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between">
                <span className="text-xl font-black text-white tabular-nums tracking-tighter italic">
                    {(value || 0).toLocaleString()}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 opacity-40 group-hover:opacity-100 transition-all`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`}></div>
                </div>
            </div>

            {/* Background Kinetic Flow */}
            <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity ${colorClass}`}></div>
        </div>
    );
};

export default StatCard;
