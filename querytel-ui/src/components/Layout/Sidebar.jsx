import React from 'react';
import {
    LayoutDashboard,
    ShieldAlert,
    FileText,
    Monitor,
    Globe,
    Settings,
    LogOut,
    Activity,
    Radar,
    Terminal,
    Lock,
    Zap
} from 'lucide-react';

const Sidebar = ({ currentPage, onNavigate }) => {
    const menuItems = [
        { title: 'Dashboard', icon: LayoutDashboard },
        { title: 'Threat Intelligence', icon: Globe },
        { title: 'Incidents & Alerts', icon: ShieldAlert, label: '3' },
        { title: 'Logs Analysis', icon: Terminal },
        { title: 'Asset Management', icon: Monitor },
        { title: 'System Health', icon: Zap },
        { title: 'Security Policy', icon: Lock },
        { title: 'Settings', icon: Settings },
    ];

    return (
        <div className="w-[260px] h-screen bg-[#020617] border-r border-white/5 text-slate-400 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
            {/* Branding */}
            <div className="h-16 flex items-center px-6 border-b border-white/5 bg-slate-900/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNavigate && onNavigate('Dashboard')}>
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-transform group-hover:scale-105">
                        <Radar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-black text-sm tracking-tighter uppercase italic leading-none">Sentinel</p>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 opacity-70">SOC PLATFORM</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-4">Tactical Operations</p>
                {menuItems.map((item) => {
                    const isActive = currentPage === item.title;
                    return (
                        <button
                            key={item.title}
                            onClick={() => onNavigate && onNavigate(item.title)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-blue-600/10 text-white font-black'
                                    : 'hover:bg-white/5 hover:text-white text-slate-500'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full shadow-[0_0_10px_#2563eb]"></div>
                            )}
                            <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-600 group-hover:text-blue-400'}`} />
                            <span className="text-[11px] font-black uppercase tracking-tight italic">{item.title}</span>
                            {item.label && (
                                <span className="ml-auto text-[9px] font-black bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer Intelligence */}
            <div className="p-4 border-t border-white/5 space-y-4 bg-gradient-to-t from-slate-900/50 to-transparent">
                <div className="bg-slate-900/40 rounded-2xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Load</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full w-[45%]" />
                    </div>
                </div>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-tight italic">Secure Sign Out</span>
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
            ` }} />
        </div>
    );
};

export default Sidebar;
