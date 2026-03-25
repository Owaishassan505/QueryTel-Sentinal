import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

// CHARTS (Lazy Load for Performance)
const SeverityDonut = React.lazy(() => import("../components/charts/SeverityDonut"));
const TrendLineChart = React.lazy(() => import("../components/charts/TrendLineChart"));
const AlertTypesPie = React.lazy(() => import("../components/charts/AlertTypesPie"));
const CountryBarChart = React.lazy(() => import("../components/charts/CountryBarChart"));
const MostActiveDevicesChart = React.lazy(() => import("../components/charts/MostActiveDevicesChart"));
const TopDestinationCountries = React.lazy(() => import("../components/charts/TopDestinationCountries"));

// WIDGETS
import SystemHealthChips from "../components/widgets/SystemHealthChips";
import RealTimeThreatList from "../components/widgets/RealTimeThreatList";
const LiveThreatRadar = React.lazy(() => import("../components/widgets/LiveThreatRadar"));
import GlowStatChips from "../components/widgets/GlowStatChips";
import CategoryCounters from "../components/widgets/CategoryCounters";

// TABLES
import LogsTableV2 from "../components/tables/LogsTableV2";

export default function Dashboard() {
    // --- STATE ---
    const [liveStats, setLiveStats] = useState({});
    const [statsState, setStatsState] = useState({
        severity: { critical: 0, high: 0, medium: 0, low: 0 },
        alertTypes: [],
        unmitigated: 0, prevented: 0, total: 0, errors: 0, warnings: 0, info: 0
    });
    const [liveLogs, setLiveLogs] = useState([]);

    // Throttling Ref
    const lastUpdate = useRef(0);

    // --- INITIAL FETCH ---
    useEffect(() => {
        axios.get("/api/logs/stats")
            .then(res => {
                const api = res.data;
                setStatsState({
                    severity: {
                        critical: api.errors || 0,
                        high: api.warnings || 0,
                        medium: api.info || 0,
                        low: 0,
                    },
                    alertTypes: [
                        { type: "Unmitigated", count: api.unmitigated || 0 },
                        { type: "Prevented", count: api.prevented || 0 },
                        { type: "General", count: api.general || 0 },
                        { type: "App Control", count: api.application || 0 },
                        { type: "Antivirus", count: api.antivirus || 0 },
                        { type: "DNS", count: api.dns || 0 },
                        { type: "IPS", count: api.ips || 0 },
                        { type: "SSL", count: api.ssl || 0 },
                        { type: "Failed Login", count: api.failedLogin || 0 },
                        { type: "VPN", count: api.vpn || 0 },
                        { type: "Admin Access", count: api.adminAccess || 0 },
                    ],
                    unmitigated: api.unmitigated || 0,
                    prevented: api.prevented || 0,
                    total: api.total || 0,
                    errors: api.errors || 0,
                    warnings: api.warnings || 0,
                    info: api.info || 0
                });
            })
            .catch(err => console.error("Stats fetch error:", err));
    }, []);

    // --- SOCKETS (THROTTLED) ---
    useEffect(() => {
        const socket = io("https://sentinel.itcold.com", {
            transports: ["websocket"],
            reconnection: true,
        });

        socket.on("stats:update", (s) => {
            const now = Date.now();
            if (now - lastUpdate.current > 2000) {
                lastUpdate.current = now;

                // Update Live Stats
                setLiveStats(s);

                // Merge into Main Stats
                setStatsState(prev => ({
                    ...prev,
                    total: s.total,
                    errors: s.errors,
                    warnings: s.warnings,
                    info: s.info,
                    unmitigated: s.unmitigated ?? prev.unmitigated,
                    prevented: s.prevented ?? prev.prevented,
                    severity: {
                        critical: s.errors || 0,
                        high: s.warnings || 0,
                        medium: s.info || 0,
                        low: 0,
                    }
                }));
            }
        });

        // Live Log Stream (Less frequent throttle needed, but good to batch)
        socket.on("alert:batch", (batch) => {
            setLiveLogs(prev => [...batch.reverse(), ...prev].slice(0, 50));
        });

        return () => socket.disconnect();
    }, []);

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-6 overflow-x-hidden">
            <React.Suspense fallback={
                <div className="flex items-center justify-center h-screen text-cyan-500 animate-pulse">
                    Loading Dashboard Intelligence...
                </div>
            }>
                {/* 1. TOP BAR: SYSTEM HEALTH */}
                <div className="mb-6">
                    <SystemHealthChips />
                </div>

                {/* 2. HEADER STATS (GLOW) */}
                <div className="mb-8">
                    <GlowStatChips stats={statsState} />
                </div>

                {/* 3. MAIN GRID */}
                <div className="grid grid-cols-12 gap-6 mb-8">

                    {/* LEFT: THREAT DISTRIBUTION (Donut + Pie) */}
                    <div className="col-span-12 md:col-span-3 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 shadow-lg backdrop-blur-sm"
                        >
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Severity Distribution</h3>
                            <div className="h-64">
                                <SeverityDonut data={statsState.severity} />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 shadow-lg backdrop-blur-sm"
                        >
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Threat Categories</h3>
                            <div className="h-64">
                                <AlertTypesPie data={statsState.alertTypes} />
                            </div>
                        </motion.div>
                    </div>

                    {/* CENTER: TRENDS + RADAR */}
                    <div className="col-span-12 md:col-span-6 space-y-6">
                        {/* Trend Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 shadow-lg backdrop-blur-sm h-96"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Traffic & Threat Trends</h3>
                                <span className="text-cyan-500 text-xs animate-pulse">● Live Ingestion</span>
                            </div>
                            <TrendLineChart />
                        </motion.div>

                        {/* Live Threat Radar (Heavy Widget) */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 md:col-span-1">
                                <LiveThreatRadar />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <CategoryCounters />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: LIVE FEED + ACTIVE DEVICES */}
                    <div className="col-span-12 md:col-span-3 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-0 shadow-lg backdrop-blur-sm overflow-hidden flex flex-col h-[600px]"
                        >
                            <div className="p-4 border-b border-gray-700/50 bg-gray-800/80">
                                <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                    Real-Time Threat Feed
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700">
                                <RealTimeThreatList logs={liveLogs} />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* 4. GEO & DEVICE INTEL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4"
                    >
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Top Source Countries</h3>
                        <div className="h-64">
                            <CountryBarChart />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4"
                    >
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Most Active Devices</h3>
                        <div className="h-64">
                            <MostActiveDevicesChart />
                        </div>
                    </motion.div>
                </div>

                {/* 5. DATA TABLE */}
                <div className="bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden">
                    <LogsTableV2 />
                </div>
            </React.Suspense>
        </div>
    );
}
