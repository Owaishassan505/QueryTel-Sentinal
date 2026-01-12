// src/components/cards/TrafficCard.jsx
import React from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

export default function TrafficCard({ title, list = [] }) {
    return (
        <div className="panel p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-3">{title}</h2>

            {(!list || list.length === 0) && (
                <p className="text-sm opacity-60">No data available</p>
            )}

            <ul className="space-y-2">
                {list.slice(0, 6).map((item, i) => (
                    <li
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition"
                    >
                        <div className="flex items-center gap-2">
                            <GlobeAltIcon className="w-5 text-primary" />
                            <span className="text-sm">{item.ip || item.name || "Unknown"}</span>
                        </div>
                        <span className="text-xs text-text/70">
                            {item.count || item.hits || 0} hits
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
