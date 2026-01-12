import React from "react";

export default function GeoHeatmap({ logs = [] }) {
    // Count logs by country
    const countryCounts = {};

    logs.forEach((log) => {
        const country = log?.dstcountry || log?.srccountry || "Unknown";
        if (!countryCounts[country]) countryCounts[country] = 0;
        countryCounts[country]++;
    });

    // Convert to sorted list
    const data = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    // Heat color scale
    const getColor = (count) => {
        if (count > 50) return "#ef4444"; // red
        if (count > 20) return "#f97316"; // orange
        if (count > 5) return "#eab308";  // yellow
        return "#22c55e"; // green
    };

    return (
        <div className="p-2">
            <div className="text-sm text-gray-300 mb-2">Top Countries (Activity Heat)</div>

            <div className="space-y-2">
                {data.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex justify-between items-center bg-panel p-2 rounded-lg border border-borderColor"
                    >
                        <span className="text-gray-200">{item.country}</span>

                        <div className="flex items-center gap-2">
                            <div
                                className="h-3 w-16 rounded-full"
                                style={{ background: getColor(item.count) }}
                            ></div>
                            <span className="text-gray-400 text-sm">{item.count}</span>
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <p className="text-gray-400 text-sm">No location data yet</p>
                )}
            </div>
        </div>
    );
}
