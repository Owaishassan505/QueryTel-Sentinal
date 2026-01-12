import React from "react";
import CountUp from "react-countup";

export default function CategoryCounters({ stats = {} }) {
    const items = [
        // MAIN COUNTERS
        { key: "total", label: "Total Alerts", color: "bg-red-600/20 border-red-500 text-red-400" },
        { key: "errors", label: "Errors", color: "bg-red-900/30 border-red-400 text-red-300" },
        { key: "warnings", label: "Warnings", color: "bg-yellow-900/30 border-yellow-400 text-yellow-300" },
        { key: "info", label: "Info", color: "bg-blue-900/30 border-blue-400 text-blue-300" },

        // ⭐ MISSING BLOCKS (NOW ADDED)
        { key: "general", label: "General Logs", color: "bg-red-700/20 border-red-400 text-red-300" },
        { key: "application", label: "Application Logs", color: "bg-purple-700/20 border-purple-400 text-purple-300" },
        { key: "antivirus", label: "Antivirus Logs", color: "bg-green-700/20 border-green-400 text-green-300" },

        // EXTRA CATEGORIES
        { key: "dns", label: "DNS", color: "bg-blue-600/20 border-blue-400 text-blue-300" },
        { key: "ssl", label: "SSL", color: "bg-green-600/20 border-green-400 text-green-300" },
        { key: "ips", label: "IPS", color: "bg-purple-600/20 border-purple-400 text-purple-300" },
        { key: "failedLogin", label: "Failed Login", color: "bg-pink-600/20 border-pink-400 text-pink-300" },
        { key: "vpn", label: "VPN", color: "bg-orange-600/20 border-orange-400 text-orange-300" },
        { key: "adminAccess", label: "Admin Access", color: "bg-red-600/20 border-red-500 text-red-300" },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-6">
            {items.map(({ key, label, color }) => (
                <div
                    key={key}
                    className={`border rounded-xl px-4 py-3 shadow-md ${color} backdrop-blur-md`}
                >
                    <p className="text-xs opacity-80">{label}</p>
                    <p className="text-xl font-bold">
                        <CountUp end={stats[key] || 0} duration={0.8} separator="," />
                    </p>
                </div>
            ))}
        </div>
    );
}
