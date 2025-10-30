import React from "react";

export default function SystemHealthBar({ health }) {
    const statusColor =
        health?.status === "Healthy" ? "text-emerald-400" : "text-red-400";
    return (
        <div className="mt-1 text-[11px] md:text-xs text-center text-slate-400">
            <span className={statusColor}>
                ● {health?.status || "Checking…"}
            </span>
            {"  "}• Uptime: {health?.uptime ?? "…"}s • Load: {health?.load ?? "…"} •
            {"  "}Memory: {health?.memoryMB ?? "…"} MB • Active Alerts: {health?.activeAlerts ?? "…"}
        </div>
    );
}
