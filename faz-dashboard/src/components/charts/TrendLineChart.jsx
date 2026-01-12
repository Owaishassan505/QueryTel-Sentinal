import React, { useMemo, useState } from "react";
import {
    LineChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

/* --------------------------
   TIME RANGE OPTIONS
--------------------------- */
const TIME_RANGES = {
    "10m": 10 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "2h": 2 * 60 * 60 * 1000,
};

/* --------------------------
   CATEGORY LIST
--------------------------- */
const CATEGORY_LIST = [
    "All",
    "IPS",
    "SSL",
    "DNS",
    "Failed Login",
    "Application Control",
    "VPN",
    "Admin Access",
    "General Traffic"
];

/* --------------------------
   SEVERITY LIST
--------------------------- */
const SEVERITY_LIST = ["All", "error", "warning", "info"];

/* --------------------------
   Convert Forti eventtime → Date
--------------------------- */
const convertEventTime = (raw) => {
    if (!raw) return new Date();
    const num = Number(raw);
    return new Date(num / 1_000_000);
};

export default function TrendLineChart({ logs = [] }) {
    const [trendType, setTrendType] = useState("severity");
    const [severityFilter, setSeverityFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [timeRange, setTimeRange] = useState("30m");

    const now = Date.now();
    const RANGE = TIME_RANGES[timeRange];

    /* ------------------------------------------
       1️⃣ PROCESS LOGS: Normalization + Filter
    ------------------------------------------- */
    const processed = useMemo(() => {
        return logs
            .map((log) => ({
                ts: convertEventTime(log.eventtime),
                severity: log.level?.toLowerCase(),
                category: log.category || "General Traffic"
            }))
            .filter((log) => log.ts.getTime() >= now - RANGE);
    }, [logs, timeRange]);

    /* ------------------------------------------
       2️⃣ GROUP INTO PER-MINUTE TIMELINE
    ------------------------------------------- */
    // --- after timeline useMemo ---
    const timeline = useMemo(() => {
        const buckets = {};
        processed.forEach((log) => {
            const minute = log.ts.toISOString().substring(0, 16);

            if (!buckets[minute]) {
                buckets[minute] = {
                    ts: log.ts,
                    time: minute.substring(11, 16),
                    count: 0
                };
            }

            if (trendType === "severity") {
                if (severityFilter === "All" || log.severity === severityFilter) {
                    buckets[minute].count++;
                }
            }

            if (trendType === "category") {
                if (categoryFilter === "All" || log.category === categoryFilter) {
                    buckets[minute].count++;
                }
            }
        });

        return Object.values(buckets).sort((a, b) => a.ts - b.ts);
    }, [processed, trendType, severityFilter, categoryFilter]);


    // ⭐ FIX BLACK AREA — create padded data
    const displayData =
        timeline.length > 1
            ? timeline
            : [
                { time: "", count: 0 },
                ...timeline,
                { time: " ", count: 0 }
            ];

    /* ------------------------------------------
       3️⃣ RENDER UI
    ------------------------------------------- */
    return (
        <div className="bg-panel p-4 rounded-xl border border-borderColor shadow">

            {/* HEADER + FILTERS */}
            <div className="flex justify-between items-center mb-3">

                <h2 className="text-md font-semibold">Threat Trend</h2>

                {/* Trend Type Switch */}
                <select
                    className="bg-black/40 border border-gray-700 px-2 py-1 rounded text-sm"
                    value={trendType}
                    onChange={(e) => setTrendType(e.target.value)}
                >
                    <option value="severity">Severity Trend</option>
                    <option value="category">Category Trend</option>
                </select>

                {/* Dynamic Filter (Severity or Category) */}
                {trendType === "severity" ? (
                    <select
                        className="bg-black/40 border border-gray-700 px-2 py-1 rounded text-sm"
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                    >
                        {SEVERITY_LIST.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                ) : (
                    <select
                        className="bg-black/40 border border-gray-700 px-2 py-1 rounded text-sm"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        {CATEGORY_LIST.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                )}

                {/* Time Range */}
                <select
                    className="bg-black/40 border border-gray-700 px-2 py-1 rounded text-sm"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                >
                    <option value="10m">Last 10 minutes</option>
                    <option value="30m">Last 30 minutes</option>
                    <option value="1h">Last 1 hour</option>
                    <option value="2h">Last 2 hours</option>
                </select>
            </div>

            {/* CHART */}
            <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayData}>

                        {/* BLUE GRADIENT */}
                        <defs>
                            <linearGradient id="smoothBlue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00aaff" stopOpacity={0.45} />
                                <stop offset="50%" stopColor="#00aaff" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#00aaff" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="time" stroke="#bbb" />
                        <YAxis stroke="#bbb" />
                        <Tooltip />

                        {/* SMOOTH BLUE LINE */}
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#00c3ff"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: "#00c3ff" }}
                            isAnimationActive={true}
                            animationDuration={1200}
                        />

                        {/* SOFT BLUE AREA FILL */}
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="none"
                            fill="url(#smoothBlue)"
                            fillOpacity={1}
                            isAnimationActive={true}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>



        </div>
    );
}
