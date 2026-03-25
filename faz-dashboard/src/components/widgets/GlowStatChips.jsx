import React from "react";
import CountUp from "react-countup";

export default function CategoryCounters({ stats = {}, onSelect }) {
    const chips = [
        { key: "unmitigated", label: "Unmitigated Threats", color: "from-red-600 to-black border border-red-500/50 shadow-red-600/60" },
        { key: "prevented", label: "Threats Blocked", color: "from-emerald-600 to-emerald-900 shadow-emerald-600/40" },

        { key: "total", label: "Total Alerts", color: "from-slate-700 to-slate-900 shadow-slate-500/20" },
        { key: "errors", label: "Errors", color: "from-red-600 to-red-800 shadow-red-600/40" },
        { key: "warnings", label: "Warnings", color: "from-yellow-500 to-yellow-700 shadow-yellow-500/40" },
        { key: "info", label: "Info", color: "from-blue-500 to-blue-700 shadow-blue-500/40" },

        { key: "general", label: "General Logs", color: "from-rose-500 to-rose-700 shadow-rose-500/40" },
        { key: "application", label: "Application Logs", color: "from-purple-500 to-purple-700 shadow-purple-500/40" },
        { key: "antivirus", label: "Antivirus Logs", color: "from-green-500 to-green-700 shadow-green-500/40" },

        { key: "dns", label: "DNS", color: "from-blue-600 to-blue-800 shadow-blue-600/40" },
        { key: "ssl", label: "SSL", color: "from-green-600 to-green-800 shadow-green-600/40" },
        { key: "ips", label: "IPS", color: "from-violet-600 to-violet-800 shadow-violet-600/40" },
        { key: "failedLogin", label: "Failed Login", color: "from-pink-600 to-pink-800 shadow-pink-600/40" },
        { key: "vpn", label: "VPN", color: "from-orange-600 to-orange-800 shadow-orange-600/40" },
        { key: "adminAccess", label: "Admin Access", color: "from-red-700 to-red-900 shadow-red-700/40" },
    ];

    return (
        <div className="flex flex-wrap gap-3 mb-5">

            {chips.map(({ key, label, color }) => (
                <div
                    key={key}
                    onClick={() => onSelect && onSelect(key)}
                    className={`
                        px-4 py-2 rounded-xl
                        text-white cursor-pointer select-none
                        bg-gradient-to-br ${color}
                        shadow-lg backdrop-blur-sm
                        transition-all duration-300
                        hover:scale-110 hover:shadow-xl
                        active:scale-95
                    `}
                    style={{
                        width: "120px",   // ⭐ FIXED WIDTH
                        minWidth: "120px",
                        textAlign: "center",
                    }}
                >
                    <div className="text-[11px] opacity-80 uppercase tracking-wide">
                        {label}
                    </div>

                    <div className="text-xl font-bold drop-shadow-md leading-tight">
                        <CountUp end={stats[key] || 0} duration={1} separator="," />
                    </div>
                </div>
            ))}

        </div>
    );
}
