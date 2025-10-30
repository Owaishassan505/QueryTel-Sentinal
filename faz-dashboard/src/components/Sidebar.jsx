import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
    const [logsOpen, setLogsOpen] = useState(false);
    const { pathname } = useLocation();

    const item = (to, label, extra = "") => (
        <Link
            to={to}
            replace
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200
        hover:text-cyan-300 hover:bg-slate-800/60
        ${pathname === to
                    ? "bg-slate-800/80 text-cyan-300 shadow-md shadow-cyan-500/20"
                    : "text-slate-200"} ${extra}`}
        >
            <span>{label}</span>
        </Link>
    );

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen p-4 border-r border-slate-800">
            <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span>🔒</span> <span>QueryTel SOC</span>
            </h1>

            <nav className="space-y-3">
                {/* Top-level items */}
                {item("/", "🏠 Dashboard")}
                {item("/analysis", "🧠 Analysis")}

                {/* AI Intelligence Sections */}
                {item("/ai-threat-insights", "🤖 AI Threat Insights")}
                {item("/darkweb-intelligence", "🕵️ Darkweb Intelligence")}

                {/* Collapsible Logs Section */}
                <div className="mt-2">
                    <button
                        onClick={() => setLogsOpen(!logsOpen)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 
              ${logsOpen
                                ? "bg-slate-800/60 text-cyan-300"
                                : "text-slate-200 hover:text-cyan-300 hover:bg-slate-800/60"}`}
                    >
                        🧾 Logs {logsOpen ? "▾" : "▸"}
                    </button>

                    {logsOpen && (
                        <ul className="ml-2 mt-2 space-y-2 border-l border-slate-700/50 pl-3">
                            <li>{item("/logs/info", "🟢 Information Logs", "text-sm")}</li>
                            <li>{item("/logs/errors", "🔴 Error Logs", "text-sm")}</li>
                            <li>{item("/logs/warnings", "🟡 Warning Logs", "text-sm")}</li>
                        </ul>
                    )}
                </div>
            </nav>
        </div>
    );
}
