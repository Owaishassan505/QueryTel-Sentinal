import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// CHARTS
import SeverityDonut from "../components/charts/SeverityDonut";
import TrendLineChart from "../components/charts/TrendLineChart";
import AlertTypesPie from "../components/charts/AlertTypesPie";
import CountryBarChart from "../components/charts/CountryBarChart";
import MostActiveDevicesChart from "../components/charts/MostActiveDevicesChart";
import TopDestinationCountries from "../components/charts/TopDestinationCountries";

// WIDGETS
import SystemHealthChips from "../components/widgets/SystemHealthChips";
import RealTimeThreatList from "../components/widgets/RealTimeThreatList";
import LiveThreatRadar from "../components/widgets/LiveThreatRadar";
import GlowStatChips from "../components/widgets/GlowStatChips";
import CategoryCounters from "../components/widgets/CategoryCounters";

// TABLES
import LogsTableV2 from "../components/tables/LogsTableV2";

// Animation
import { motion } from "framer-motion";
import CountUp from "react-countup";

export default function Dashboard({ logs = [], stats = {}, chartData = [] }) {

    /* ===============================
       LIVE STATE (ADDED – REQUIRED)
    ================================ */
    const [liveLogs, setLiveLogs] = useState([]);
    const [liveStats, setLiveStats] = useState({
        total: 0,
        errors: 0,
        warnings: 0,
        info: 0,
    });

    const [filteredLogs, setFilteredLogs] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [countryFilter, setCountryFilter] = useState(null);
    const [topCountries, setTopCountries] = useState([]);
    const [statsState, setStatsState] = useState({});

    /* ===============================
       INITIAL REST FETCH (KEEP)
    ================================ */
    useEffect(() => {
        axios.get("/api/logs/stats")
            .then(res => {
                const api = res.data;

                const severity = {
                    critical: api.errors || 0,
                    high: api.warnings || 0,
                    medium: api.info || 0,
                    low: 0,
                };

                const alertTypes = [
                    { type: "General", count: api.general || 0 },
                    { type: "App Control", count: api.application || 0 },
                    { type: "Antivirus", count: api.antivirus || 0 },
                    { type: "DNS", count: api.dns || 0 },
                    { type: "IPS", count: api.ips || 0 },
                    { type: "SSL", count: api.ssl || 0 },
                    { type: "Failed Login", count: api.failedLogin || 0 },
                    { type: "VPN", count: api.vpn || 0 },
                    { type: "Admin Access", count: api.adminAccess || 0 },
                ];

                setStatsState({ severity, alertTypes });
            })
            .catch(err => console.error("Stats fetch error:", err));
    }, []);

    /* ===============================
       SOCKET.IO — LIVE ENGINE
    ================================ */
    useEffect(() => {
        const socket = io("https://sentinel.itcold.com", {
            transports: ["websocket"],
            reconnection: true,
        });

        // LIVE STATS
        socket.on("stats:update", (s) => {
            setLiveStats(s);

            setStatsState(prev => ({
                ...prev,
                total: s.total,
                errors: s.errors,
                warnings: s.warnings,
                info: s.info,
                general: s.general ?? prev.general,
                application: s.application ?? prev.application,
                antivirus: s.antivirus ?? prev.antivirus,
                dns: s.dns ?? prev.dns,
                ssl: s.ssl ?? prev.ssl,
                ips: s.ips ?? prev.ips,
                failedLogin: s.failedLogin ?? prev.failedLogin,
                vpn: s.vpn ?? prev.vpn,
                adminAccess: s.adminAccess ?? prev.adminAccess,

                severity: {
                    critical: s.errors || 0,
                    high: s.warnings || 0,
                    medium: s.info || 0,
                    low: 0,
                }
            }));
        });

        // LIVE LOG STREAM
        socket.on("alert:batch", (batch) => {
            setLiveLogs(prev =>
                [...batch.reverse(), ...prev].slice(0, 300)
            );
        });

        return () => socket.disconnect();
    }, []);

    /* ===============================
       FILTER HANDLERS (UNCHANGED)
    ================================ */
    const handleCounterClick = async (key) => {
        let filter = {};

        if (key === "total") {
            const res = await axios.post("/api/analysis/filter", {});
            setFilteredLogs(res.data.results);
            setDrawerOpen(true);
            return;
        }

        if (key === "errors") filter.severity = "error";
        if (key === "warnings") filter.severity = "warning";
        if (key === "info") filter.severity = "info";

        const categories = {
            general: "General Traffic",
            application: "Application Control",
            antivirus: "Antivirus",
            dns: "DNS",
            ssl: "SSL",
            ips: "IPS",
            failedLogin: "Failed Login",
            vpn: "VPN",
            adminAccess: "Admin Access",
        };

        if (categories[key]) filter.category = categories[key];

        const res = await axios.post("/api/analysis/filter", filter);
        setFilteredLogs(res.data.results);
        setDrawerOpen(true);
    };

    const handleCountryFilter = (country) => {
        axios.post("/api/analysis/filter", { dstCountry: country }).then(res => {
            setFilteredLogs(res.data.results);
            setDrawerOpen(true);
        });
    };

    const handleCountryBarClick = (country) => {
        axios.post("/api/analysis/filter", { srcCountry: country }).then(res => {
            setFilteredLogs(res.data.results);
            setDrawerOpen(true);
        });
    };



    /* ===============================
       LOG DRAWER (UNCHANGED)
    ================================ */
    const LogDrawer = ({ open, onClose, logs }) => {
        const [page, setPage] = useState(1);
        const perPage = 10;
        if (!open) return null;

        const totalPages = Math.ceil(logs.length / perPage);
        const start = (page - 1) * perPage;
        const visible = logs.slice(start, start + perPage);

        return (
            <div className="fixed inset-0 bg-black/60 flex justify-end z-[9999]">
                <div className="w-[480px] h-full bg-[#0f0f11] border-l border-gray-800 flex flex-col">
                    <div className="p-4 border-b border-gray-800 flex justify-between">
                        <h2 className="text-white font-semibold">
                            Filtered Logs ({logs.length})
                        </h2>
                        <button onClick={onClose} className="text-red-400 text-xl">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {visible.map((log, i) => (
                            <div key={i} className="bg-[#1a1a1c] p-4 rounded border border-gray-700">
                                <div
                                    className="text-gray-300 text-sm"
                                    dangerouslySetInnerHTML={{
                                        __html: log.humanMessage
                                            ?.replace(/\n/g, "<br>")
                                            ?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                    }}
                                />
                                <div className="text-xs text-gray-500 mt-2">
                                    {log.sourceIp} → {log.destIp}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    /* ===============================
       TOP COUNTRIES (KEEP)
    ================================ */
    useEffect(() => {
        axios.get("/api/top-countries").then(res => {
            if (res.data.ok) setTopCountries(res.data.data);
        });
    }, []);



    /* ===============================
       RENDER
    ================================ */
    return (
        <div className="pt-2 pb-4">
            <GlowStatChips stats={statsState} />

            <div className="grid grid-cols-12 gap-4 mt-6">

                <div className="col-span-12 lg:col-span-6 bg-panel p-4 rounded-xl">
                    <h2 className="mb-3 font-semibold">Threat Trend</h2>
                    <TrendLineChart logs={liveLogs} />
                </div>

                <div className="col-span-12 lg:col-span-6 grid grid-cols-12 gap-4">

                    <div className="col-span-4 bg-panel p-4 rounded-xl text-center">
                        <h2 className="mb-2 font-semibold">Alert Types</h2>
                        <AlertTypesPie data={statsState.alertTypes || []} />
                    </div>

                    <div className="col-span-4 bg-panel p-4 rounded-xl text-center">
                        <h2 className="mb-2 font-semibold">Severity</h2>
                        <SeverityDonut stats={statsState.severity || {}} />
                    </div>

                    <div className="col-span-4 bg-panel p-4 rounded-xl text-center">
                        <h2 className="mb-2 font-semibold text-red-400">Live Threat Radar</h2>
                        <LiveThreatRadar />
                    </div>

                </div>

                <div className="col-span-12 md:col-span-6 bg-panel p-4 rounded-xl">
                    <h2 className="mb-2 font-semibold">Most Active Devices</h2>
                    <MostActiveDevicesChart />
                </div>

                <div className="col-span-12 md:col-span-6 bg-panel p-4 rounded-xl">
                    <h2 className="mb-2 font-semibold">Top Destination Countries</h2>
                    <TopDestinationCountries onSelectCountry={handleCountryFilter} />
                </div>

            </div>

            <div className="bg-panel p-4 rounded-xl mt-6">
                <h2 className="mb-2 font-semibold">Top Countries</h2>
                <CountryBarChart data={topCountries} onCountrySelect={handleCountryBarClick} />
            </div>

            <div className="bg-panel p-4 rounded-xl mt-6">
                <h2 className="mb-2 font-semibold">Latest Logs (LIVE)</h2>
                <LogsTableV2
                    logs={liveLogs}
                    categoryFilter={categoryFilter}
                    countryFilter={countryFilter}
                />
            </div>

            <LogDrawer
                open={drawerOpen}
                logs={filteredLogs}
                onClose={() => setDrawerOpen(false)}
            />
        </div>
    );
}

