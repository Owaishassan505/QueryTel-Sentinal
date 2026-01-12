import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { backendURL } from "../../config";

export default function RealTimeThreatList() {
    const [threats, setThreats] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        const socket = io(backendURL, {
            transports: ["websocket"],
            auth: { token },
        });

        socket.on("alert:batch", (batch) => {
            setThreats((prev) => {
                const merged = [...batch, ...prev];
                return merged.slice(0, 200);
            });
        });

        // Listen for donut-category clicks
        window.addEventListener("FILTER_BY_CATEGORY", (e) => {
            setActiveCategory(e.detail);
        });

        return () => socket.disconnect();
    }, []);

    // Filter logic
    const filteredThreats = activeCategory
        ? threats.filter((t) => t.category === activeCategory)
        : threats;

    const getColor = (sev) => {
        sev = (sev || "").toLowerCase();
        if (sev === "critical" || sev === "error") return "#ef4444"; // red
        if (sev === "warning" || sev === "warn") return "#facc15"; // yellow
        if (sev === "info") return "#3b82f6"; // blue
        return "#10b981"; // green
    };

    return (
        <div className="bg-panel rounded-xl border border-borderColor p-4 shadow-lg h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-red-400 tracking-wide">
                Real-Time Threat Feed
            </h2>

            {activeCategory && (
                <div className="mb-2 text-xs text-gray-300">
                    🔍 Filtering by category: <b>{activeCategory}</b>
                    <button
                        onClick={() => setActiveCategory(null)}
                        className="ml-2 text-blue-400 underline"
                    >
                        Clear
                    </button>
                </div>
            )}

            <div className="overflow-y-auto space-y-4 pr-2" style={{ maxHeight: "420px" }}>
                {filteredThreats.length === 0 && (
                    <div className="text-gray-500 text-sm text-center py-10">
                        No logs found...
                    </div>
                )}

                {filteredThreats.map((t, idx) => (
                    <div key={idx} className="relative pl-5">

                        {/* LEFT COLORED LINE (FIXED) */}
                        <div
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                            style={{ backgroundColor: getColor(t.severity) }}
                        />

                        {/* Log Card */}
                        <div className="bg-black/20 border border-white/5 rounded-lg p-3 ml-2">
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-semibold" style={{ color: getColor(t.severity) }}>
                                    {t.severity?.toUpperCase()}
                                </span>

                                <span className="text-xs text-gray-400">
                                    {new Date(t.ts).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="text-sm text-gray-200">
                                {t.cleanMessage || t.message}
                            </div>

                            {t.category && (
                                <div className="text-xs text-blue-300 mt-1">
                                    Category: {t.category}
                                </div>
                            )}
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}