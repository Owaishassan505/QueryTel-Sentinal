import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import io from "socket.io-client";
import { Search, Bell, User, LayoutGrid, Activity, ShieldCheck, Radar, Clock, Bot, Sparkles } from "lucide-react";

import Sidebar from "./components/layout/Sidebar";
import PageWrapper from "./components/layout/PageWrapper";
import Footer from "./components/Footer";
import { backendURL } from "./config";
import CopilotPanel from "./components/Copilot/CopilotPanel";

// Pages
import ModernDashboard from "./pages/ModernDashboard";
import Analysis from "./pages/Analysis";
import AIThreatInsights from "./pages/AIThreatInsights";
import DarkwebIntelligence from "./pages/DarkwebIntelligence";
import InfoLogs from "./pages/InfoLogs";
import ErrorLogs from "./pages/ErrorLogs";
import WarningLogs from "./pages/WarningLogs";
import GlobalThreatMap from "./pages/GlobalThreatMap";
import AssetIdentity from "./pages/AssetIdentity";
import EventExplorer from "./pages/EventExplorer";
import Incidents from "./pages/Incidents";
import MitreCoverage from "./pages/MitreCoverage";
import EventMonitor from "./pages/EventMonitor";
import SOCDashboard from "./pages/SOCDashboard";
import Tickets from "./pages/Tickets";
import GlobalSearch from "./pages/GlobalSearch";
import NetworkTrafficAnalysis from "./pages/NetworkTrafficAnalysis";
import EarlyWarning from "./pages/EarlyWarning";

const Header = ({ onOpenCopilot }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSearch = (e) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-3xl border-b border-white/5 px-6 py-3 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                        <Radar className="w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">QUERYTEL <span className="text-blue-500">SENTINEL</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                <Activity className="w-2.5 h-2.5" /> SYSTEM OPERATIONAL
                            </span>
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">•</span>
                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">GLOBAL DEFENSE: ONLINE</span>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-2 focus-within:border-blue-500/50 transition-all w-96 group">
                    <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search assets, IPs, or logs..."
                        className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-200 ml-3 w-full placeholder:text-slate-600 shadow-none ring-0 focus:ring-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                    <div className="flex items-center gap-1 ml-2">
                        <span className="text-[9px] font-black text-slate-700 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">⌘</span>
                        <span className="text-[9px] font-black text-slate-700 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">K</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={onOpenCopilot}
                    className="hidden xl:flex items-center gap-3 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 relative group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
                    <Bot className="w-4 h-4" />
                    <span>Quick Copilot</span>
                    <Sparkles className="w-3 h-3 text-blue-200 animate-pulse" />
                </button>

                <div className="hidden xl:flex flex-col items-end border-r border-white/10 pr-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 pointer-events-none">Active Analysts</p>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-7 h-7 rounded-lg border-2 border-[#020617] bg-slate-800 flex items-center justify-center text-[9px] font-black text-slate-400 hover:z-10 hover:border-blue-500/50 transition-all cursor-pointer">
                                U{i}
                            </div>
                        ))}
                        <div className="w-7 h-7 rounded-lg border-2 border-[#020617] bg-blue-600 flex items-center justify-center text-[9px] font-black text-white cursor-pointer hover:bg-blue-500 transition-colors">
                            +
                        </div>
                    </div>
                </div>

                <div className="hidden xl:flex items-center gap-4 border-r border-white/10 pr-6 ml-2">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ops Time</p>
                        <p className="text-[10px] font-mono font-bold text-white uppercase italic">{currentTime.toLocaleTimeString()}</p>
                    </div>
                    <Clock className="w-4 h-4 text-blue-500/50" />
                </div>

                <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Active</span>
                </div>

                <div className="flex items-center gap-3 pl-2 group cursor-pointer border-l border-white/10 ml-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-[11px] font-black text-white uppercase italic leading-none">Admin Portal</p>
                        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter mt-1 opacity-70">L3 Analyst</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-800 rounded-2xl border border-white/5 flex items-center justify-center group-hover:border-blue-500/50 transition-all shadow-inner">
                        <User className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                </div>
            </div>
        </header>
    );
};


export default function ProtectedApp() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [hoverExpand, setHoverExpand] = useState(false);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);

    const token = localStorage.getItem("token");

    useEffect(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        if (saved !== null) setCollapsed(saved === "true");
    }, []);

    const toggleCollapse = () => {
        const newValue = !collapsed;
        setCollapsed(newValue);
        localStorage.setItem("sidebarCollapsed", newValue);
    };

    const effectiveCollapsed = collapsed && !hoverExpand;
    const location = useLocation();
    const isMapPage = location.pathname === "/global-map";

    if (!token) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest">Authenticating...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0c10] flex">
            {/* SIDEBAR */}
            <div className={`transition-all duration-300 ${effectiveCollapsed ? 'w-20' : 'w-[260px]'}`}>
                <Sidebar
                    collapsed={effectiveCollapsed}
                    onToggle={toggleCollapse}
                    onHoverStart={() => setHoverExpand(true)}
                    onHoverEnd={() => setHoverExpand(false)}
                    onOpenCopilot={() => setIsCopilotOpen(true)}
                />
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header onOpenCopilot={() => setIsCopilotOpen(true)} />
                <main className={`flex-1 overflow-y-auto ${isMapPage ? 'p-0' : 'p-6'}`}>
                    <Routes>
                        <Route path="/" element={<ModernDashboard />} />
                        <Route path="/analysis" element={<Analysis />} />
                        <Route path="/ai-threat-insights" element={<AIThreatInsights />} />
                        <Route path="/darkweb-intelligence" element={<DarkwebIntelligence />} />
                        <Route path="/logs/info" element={<InfoLogs />} />

                        <Route path="/logs/warning" element={<WarningLogs />} />
                        <Route path="/global-map" element={<GlobalThreatMap />} />
                        <Route path="/asset-identity" element={<AssetIdentity />} />
                        <Route path="/event-explorer" element={<EventExplorer />} />
                        <Route path="/incidents" element={<Incidents />} />
                        <Route path="/mitre-coverage" element={<MitreCoverage />} />
                        <Route path="/event-monitor" element={<EventMonitor />} />
                        <Route path="/soc-dashboard" element={<SOCDashboard />} />
                        <Route path="/tickets" element={<Tickets />} />
                        <Route path="/search" element={<GlobalSearch />} />
                        <Route path="/network-traffic" element={<NetworkTrafficAnalysis />} />
                        <Route path="/early-warning" element={<EarlyWarning />} />
                    </Routes>
                </main>
                <Footer />
            </div>

            <CopilotPanel isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
        </div>
    );
}
