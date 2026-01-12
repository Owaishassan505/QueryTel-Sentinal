// src/components/widgets/SystemHealthCard.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../api/api";

export default function SystemHealthCard() {
    const [health, setHealth] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadHealth() {
            try {
                setError("");
                const { ok, data } = await apiFetch("/api/health");

                if (!ok) {
                    setError("Health API returned error");
                    return;
                }

                setHealth(data);
            } catch (err) {
                console.error("Health API failed:", err);
                setError("Unable to reach health API");
            }
        }

        loadHealth();
        const id = setInterval(loadHealth, 30_000); // refresh every 30s
        return () => clearInterval(id);
    }, []);

    if (error) {
        return (
            <div className="bg-panel p-4 rounded-xl border border-red-500/60 shadow-lg">
                <h3 className="text-sm font-semibold text-red-400 mb-2">
                    System Health
                </h3>
                <p className="text-xs text-red-200">{error}</p>
            </div>
        );
    }

    if (!health) {
        return (
            <div className="bg-panel p-4 rounded-xl border border-borderColor shadow-lg">
                <h3 className="text-sm font-semibold text-gray-200 mb-2">
                    System Health
                </h3>
                <p className="text-xs text-gray-400">Loading health…</p>
            </div>
        );
    }

    const statusColor =
        health.status === "Healthy"
            ? "text-emerald-400"
            : health.status === "Degraded"
                ? "text-amber-400"
                : "text-red-400";

    return (
        <div className="bg-panel p-4 rounded-xl border border-borderColor shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-200">
                    System Health
                </h3>
                <span className={`text-xs font-semibold ${statusColor}`}>
                    {health.status || "Unknown"}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                    <div className="text-gray-400">Uptime</div>
                    <div className="text-gray-100">
                        {Math.round((health.uptime || 0) / 60)} min
                    </div>
                </div>

                <div>
                    <div className="text-gray-400">Memory</div>
                    <div className="text-gray-100">
                        {health.memoryMB ?? "—"} MB
                    </div>
                </div>

                <div>
                    <div className="text-gray-400">CPU Load (1m)</div>
                    <div className="text-gray-100">
                        {health.load != null ? health.load.toFixed(2) : "—"}
                    </div>
                </div>

                <div>
                    <div className="text-gray-400">MongoDB</div>
                    <div className="text-gray-100">{health.mongo || "Unknown"}</div>
                </div>

                <div>
                    <div className="text-gray-400">Active Alerts</div>
                    <div className="text-gray-100">
                        {health.activeAlerts ?? 0}
                    </div>
                </div>

                <div>
                    <div className="text-gray-400">API Latency</div>
                    <div className="text-gray-100">
                        {health.latency != null ? `${health.latency} ms` : "—"}
                    </div>
                </div>
            </div>

            <div className="mt-3 text-[10px] text-gray-500">
                Last check:{" "}
                {health.timestamp
                    ? new Date(health.timestamp).toLocaleTimeString()
                    : "n/a"}
            </div>
        </div>
    );
}
