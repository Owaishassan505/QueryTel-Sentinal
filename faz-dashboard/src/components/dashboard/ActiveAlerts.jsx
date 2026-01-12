import React from "react";

export default function ActiveAlerts({ logs }) {
    const recent = logs.slice(0, 5);

    return (
        <div className="bg-card rounded-xl p-4 border border-borderColor shadow-soft">
            <h2 className="text-lg font-semibold mb-3 text-gray-300">Active Alerts</h2>

            <div className="flex flex-col gap-3">
                {recent.map((log, i) => (
                    <div key={i} className="p-3 rounded-lg bg-panel border border-borderColor">
                        <div className="text-sm text-gray-400">{log.message}</div>
                        <div className="text-xs text-primary mt-1">{log.severity.toUpperCase()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
