// src/ProtectedApp.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import io from "socket.io-client";

import Sidebar from "./components/layout/Sidebar";
import PageWrapper from "./components/layout/PageWrapper";
import Footer from "./components/Footer";
import { backendURL } from "./config";

// Pages
import Dashboard from "./pages/Dashboard";
import Analysis from "./pages/Analysis";
import InfoLogs from "./pages/InfoLogs";
import ErrorLogs from "./pages/ErrorLogs";
import WarningLogs from "./pages/WarningLogs";
import AIThreatInsights from "./pages/AIThreatInsights";
import DarkwebIntelligence from "./pages/DarkwebIntelligence";

export default function ProtectedApp() {
    const [socketConnection, setSocketConnection] = useState(false);
    const [paused, setPaused] = useState(false);

    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({});
    const [chartData, setChartData] = useState([]);

    const [sidebarOpen, setSidebarOpen] = useState(false);     // mobile drawer
    const [collapsed, setCollapsed] = useState(false);         // desktop pinned state
    const [hoverExpand, setHoverExpand] = useState(false);     // hover expand state

    const token = localStorage.getItem("token");

    /* SOCKET.IO */
    useEffect(() => {
        if (!token) return;

        const socket = io(backendURL, {
            transports: ["websocket"],
            reconnection: true,
            auth: { token: localStorage.getItem("token") },
        });

        socket.on("connect", () => setSocketConnection(true));
        socket.on("disconnect", () => setSocketConnection(false));

        socket.on("alert:batch", (batch) => {
            if (!paused) {
                setLogs((prev) => {
                    const merged = [...batch, ...prev];
                    return merged.slice(0, 300);
                });
            }
        });

        socket.on("stats:update", (s) => {
            setStats(prev => ({
                prevTotal: prev.total ?? 0,
                prevErrors: prev.errors ?? 0,
                prevWarnings: prev.warnings ?? 0,
                prevInfo: prev.info ?? 0,
                total: s.total,
                errors: s.errors,
                warnings: s.warnings,
                info: s.info
            }));

            const now = new Date().toISOString();
            setChartData(prev => [
                ...prev,
                { time: now, errors: s.errors, warnings: s.warnings },
            ]);
        });

        return () => socket.disconnect();
    }, [token, paused]);

    // Load collapse state
    useEffect(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        if (saved !== null) {
            setCollapsed(saved === "true");
        }
    }, []);

    const toggleCollapse = () => {
        const newValue = !collapsed;
        setCollapsed(newValue);
        localStorage.setItem("sidebarCollapsed", newValue);
    };

    // This is the REAL collapsed state that sidebar will use
    const effectiveCollapsed = collapsed && !hoverExpand;

    if (!token) {
        return (
            <div className="text-center text-white p-10">
                <h2>Authenticating...</h2>
            </div>
        );
    }

    return (
        <div className="flex bg-panel min-h-screen text-gray-100">

            {/* SIDEBAR */}
            <div
                className={`
                    fixed lg:static top-0 left-0 h-full z-50
                    transform transition-transform duration-300
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0
                `}
            >
                <Sidebar
                    collapsed={effectiveCollapsed}
                    onToggle={toggleCollapse}
                    onHoverStart={() => setHoverExpand(true)}
                    onHoverEnd={() => setHoverExpand(false)}
                />
            </div>

            {/* MOBILE OVERLAY */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* MAIN CONTENT */}
            <div
                className={`
                    flex-1 flex flex-col transition-all duration-300
                    ${effectiveCollapsed ? "lg:ml-20" : "lg:ml-64"}
                `}
            >
                {/* MOBILE MENU */}
                <div className="lg:hidden p-3 bg-panel border-b border-borderColor flex items-center">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 bg-gray-800 rounded text-white"
                    >
                        ☰
                    </button>
                    <span className="ml-3 font-semibold text-primary">
                        QueryTel SOC v3
                    </span>
                </div>

                {/* ROUTES */}
                <PageWrapper>
                    <Routes>
                        <Route path="/" element={<Dashboard logs={logs} stats={stats} chartData={chartData} />} />
                        <Route path="/analysis" element={<Analysis logs={logs} />} />
                        <Route path="/ai-threat-insights" element={<AIThreatInsights />} />
                        <Route path="/darkweb-intelligence" element={<DarkwebIntelligence />} />
                        <Route path="/logs/info" element={<InfoLogs />} />
                        <Route path="/logs/error" element={<ErrorLogs />} />
                        <Route path="/logs/warning" element={<WarningLogs />} />
                    </Routes>
                </PageWrapper>

                <Footer />
            </div>
        </div>
    );
}
