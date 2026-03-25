import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    BarChart3,
    ShieldAlert,
    Globe,
    Cpu,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Terminal,
    AlertTriangle,
    Info,
    ShieldCheck,
    Bot,
    Sparkles,
    Fingerprint,
    Shield,
    Target,
    Radar,
    Ticket,
    Network,
    Radio
} from "lucide-react";

export default function Sidebar({
    collapsed = false,
    onToggle,
    onHoverStart,
    onHoverEnd,
    onOpenCopilot
}) {
    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/login";
    };

    const linkBase = "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative";

    const linkAction = ({ isActive }) => {
        return `${linkBase} ${isActive
            ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
            : "text-slate-400 border border-transparent hover:bg-slate-800/50 hover:text-slate-100 hover:border-slate-800"}`;
    };

    return (
        <aside
            className={`
                fixed top-0 left-0 h-screen
                ${collapsed ? "w-20" : "w-[260px]"}
                bg-[#0f172a] shadow-2xl z-50 flex flex-col pt-0
                transition-all duration-300 ease-in-out
            `}
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
        >
            {/* BRANDING */}
            <div className={`h-16 flex items-center px-6 border-b border-slate-800/50 mb-4 bg-slate-900/50`}>
                {!collapsed ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-black text-lg tracking-tighter">QueryTel SOC</span>
                    </div>
                ) : (
                    <div className="w-full flex justify-center">
                        <ShieldAlert className="w-6 h-6 text-blue-500" />
                    </div>
                )}
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
                <NavLink to="/" className={linkAction}>
                    <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Dashboard</span>}
                </NavLink>

                <NavLink to="/soc-dashboard" className={linkAction}>
                    <BarChart3 className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">SOC Dashboard</span>}
                </NavLink>

                <NavLink to="/tickets" className={linkAction}>
                    <Ticket className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Tickets</span>}
                </NavLink>

                <NavLink to="/event-monitor" className={linkAction}>
                    <Radar className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                        <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-semibold">Event Monitor</span>
                            <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded animate-pulse">LIVE</span>
                        </div>
                    )}
                </NavLink>

                <NavLink to="/analysis" className={linkAction}>
                    <Cpu className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Analysis</span>}
                </NavLink>

                <NavLink to="/network-traffic" className={linkAction} title="Network Traffic Analysis">
                    <Network className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Network Traffic</span>}
                </NavLink>

                <NavLink to="/early-warning" className={linkAction} title="Threat Early Warning">
                    <Radio className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Early Warning</span>}
                </NavLink>

                <NavLink to="/ai-threat-insights" className={linkAction}>
                    <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">AI Insights</span>}
                </NavLink>

                <NavLink to="/global-map" className={linkAction}>
                    <Globe className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Attack Map</span>}
                </NavLink>

                <NavLink to="/asset-identity" className={linkAction}>
                    <Fingerprint className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Asset Identity</span>}
                </NavLink>

                <NavLink to="/event-explorer" className={linkAction}>
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Event Explorer</span>}
                </NavLink>

                <NavLink to="/incidents" className={linkAction}>
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Incidents</span>}
                </NavLink>

                <NavLink to="/mitre-coverage" className={linkAction}>
                    <Target className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">MITRE Coverage</span>}
                </NavLink>


                <button
                    onClick={onOpenCopilot}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-blue-400 hover:bg-blue-600/10 border border-transparent hover:border-blue-500/20"
                >
                    <div className="relative">
                        <Bot className="w-5 h-5 flex-shrink-0" />
                        <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-blue-300 animate-pulse" />
                    </div>
                    {!collapsed && <span className="text-sm font-bold">QueryTel Copilot</span>}
                </button>

                <div className={`mt-6 mb-2 px-3 flex items-center`}>
                    <div className="h-px bg-slate-800 flex-1"></div>
                    {!collapsed && <span className="mx-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Logs</span>}
                    <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <NavLink to="/logs/info" className={linkAction}>
                    <Info className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Info</span>}
                </NavLink>

                <NavLink to="/logs/warning" className={linkAction}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-semibold">Warnings</span>}
                </NavLink>


            </nav>

            {/* FOOTER ACTIONS */}
            <div className="p-4 bg-slate-900/30 border-t border-slate-800/50 mt-auto">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mb-2"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-bold">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
