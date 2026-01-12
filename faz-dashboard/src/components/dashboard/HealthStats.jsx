import React, { useEffect, useState } from "react";
import { apiFetch } from "../../api/api";

export default function HealthStats() {
    const [health, setHealth] = useState(null);

    useEffect(() => {
        async function load() {
            const data = await apiFetch("/api/health");
            setHealth(data);
        }
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!health) return <div className="text-gray-400">Loading...</div>;

    return (
        <div className="bg-card rounded-xl p-4 border border-borderColor shadow-soft">
            <h2 className="text-lg font-semibold mb-3 text-gray-300">System Health</h2>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div>Uptime:</div><div>{health.uptime}s</div>
                <div>Memory:</div><div>{health.memoryMB} MB</div>
                <div>Load:</div><div>{health.load}</div>
                <div>Latency:</div><div>{health.latency} ms</div>
            </div>
        </div>
    );
}
