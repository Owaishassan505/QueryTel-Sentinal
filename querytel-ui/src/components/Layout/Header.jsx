import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Clock, Activity, Radar } from 'lucide-react';

const Header = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="h-16 bg-[#020617]/90 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-4 group cursor-pointer lg:hidden">
                    <Radar className="w-6 h-6 text-blue-500 animate-pulse" />
                    <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">QUERYTEL <span className="text-blue-500">SENTINEL</span></h1>
                </div>

                <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-2 focus-within:border-blue-500/50 transition-all w-96 group shadow-inner">
                    <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search assets, IPs, or logs..."
                        className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-200 ml-3 w-full placeholder:text-slate-600"
                    />
                    <div className="flex items-center gap-1 ml-2">
                        <span className="text-[9px] font-black text-slate-700 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">⌘</span>
                        <span className="text-[9px] font-black text-slate-700 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">K</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden xl:flex items-center gap-4 border-r border-white/10 pr-6">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Global Ops Time</p>
                        <p className="text-[10px] font-mono font-bold text-white uppercase italic leading-none">{time.toLocaleTimeString()}</p>
                    </div>
                    <Clock className="w-4 h-4 text-blue-500/50" />
                </div>

                <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Active</span>
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#020617] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                    </button>

                    <div className="flex items-center gap-3 pl-2 group cursor-pointer border-l border-white/10 ml-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-[11px] font-black text-white uppercase italic leading-none">Admin Portal</p>
                            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter mt-1 opacity-70">L3 Analyst</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-900 rounded-2xl border border-white/5 flex items-center justify-center group-hover:border-blue-500/50 transition-all shadow-inner">
                            <User className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
