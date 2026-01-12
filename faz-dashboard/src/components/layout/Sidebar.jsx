import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import CopilotChat from "./CopilotChat";

import {
    HomeIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    FireIcon,
    DocumentMagnifyingGlassIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar({
    collapsed = false,
    onToggle,
    onHoverStart,
    onHoverEnd
}) {
    const [showCopilot, setShowCopilot] = useState(false);

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/login";
    };

    const link =
        `flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-primary/20 hover:text-white transition 
        ${collapsed ? "justify-center px-2" : ""}`;

    const active =
        `flex items-center gap-3 px-4 py-2 rounded-md bg-primary text-white shadow-glow 
        ${collapsed ? "justify-center px-2" : ""}`;

    return (
        <aside
            className={`
        fixed top-0 left-0
        ${collapsed ? "w-20" : "w-64"}
        h-full bg-panel border-r border-borderColor p-4 z-50 flex flex-col
        transition-all duration-300 ease-in-out
    `}

            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
        >
            {/* Copilot Window */}
            <CopilotChat open={showCopilot} onClose={() => setShowCopilot(false)} />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                {!collapsed && (
                    <h1 className="text-xl font-bold text-primary whitespace-nowrap">
                        QueryTel SOC v3
                    </h1>
                )}

                <button
                    onClick={onToggle}
                    className="p-2 rounded hover:bg-gray-700 text-gray-300"
                >
                    {collapsed ? "➡" : "⬅"}
                </button>
            </div>

            {/* NAVIGATION */}
            <nav className="flex flex-col gap-2">

                <NavLink to="/" className={({ isActive }) => (isActive ? active : link)}>
                    <HomeIcon className="w-6 h-6" />
                    {!collapsed && "Dashboard"}
                </NavLink>

                <NavLink to="/analysis" className={({ isActive }) => (isActive ? active : link)}>
                    <ChartBarIcon className="w-6 h-6" />
                    {!collapsed && "Analysis"}
                </NavLink>

                <NavLink to="/ai-threat-insights" className={({ isActive }) => (isActive ? active : link)}>
                    <ShieldCheckIcon className="w-6 h-6" />
                    {!collapsed && "AI Threat Insights"}
                </NavLink>

                <NavLink to="/darkweb-intelligence" className={({ isActive }) => (isActive ? active : link)}>
                    <FireIcon className="w-6 h-6" />
                    {!collapsed && "Darkweb Intelligence"}
                </NavLink>

                <NavLink to="/global-map" className={({ isActive }) => (isActive ? active : link)}>
                    <span className="text-xl">🌐</span>
                    {!collapsed && "Global Attack Map"}
                </NavLink>

                {!collapsed && (
                    <div className="mt-4 text-gray-400 text-xs uppercase px-2">Logs</div>
                )}

                <NavLink to="/logs/info" className={({ isActive }) => (isActive ? active : link)}>
                    <InformationCircleIcon className="w-6 h-6" />
                    {!collapsed && "Info Logs"}
                </NavLink>

                <NavLink to="/logs/error" className={({ isActive }) => (isActive ? active : link)}>
                    <ExclamationTriangleIcon className="w-6 h-6" />
                    {!collapsed && "Error Logs"}
                </NavLink>

                <NavLink to="/logs/warning" className={({ isActive }) => (isActive ? active : link)}>
                    <DocumentMagnifyingGlassIcon className="w-6 h-6" />
                    {!collapsed && "Warning Logs"}
                </NavLink>

                {/* Copilot */}
                <button
                    onClick={() => setShowCopilot(true)}
                    className={`
                        cursor-pointer mt-5 text-white bg-primary hover:bg-primary/80
                        p-3 rounded-lg flex items-center gap-3
                        ${collapsed ? "justify-center" : ""}
                    `}
                >
                    🤖
                    {!collapsed && "Copilot"}
                </button>

            </nav>

            {/* Logout */}
            <div className={`mt-auto pt-4 ${collapsed ? "px-1" : "px-4"}`}>
                <button
                    onClick={handleLogout}
                    className={`
                        w-full text-left px-4 py-3 rounded-md bg-red-600 hover:bg-red-700
                        text-white font-semibold
                        ${collapsed ? "text-center px-0" : ""}
                    `}
                >
                    {collapsed ? "🚪" : "Logout"}
                </button>
            </div>
        </aside>
    );
}
