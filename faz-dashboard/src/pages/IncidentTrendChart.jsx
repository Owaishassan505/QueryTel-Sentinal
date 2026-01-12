import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { io } from "socket.io-client";

const API_BASE = "https://sentinel.itcold.com";
const SOCKET_URL = "https://sentinel.itcold.com"; // same host

export default function IncidentTrendChart() {
    const [data, setData] = useState([]);
    const [filter, setFilter] = useState("all");
    const [socketOk, setSocketOk] = useState(false);

    const formatTime = (ts) => {
        try {
            return new Date(ts).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return ts;
        }
    };

    // 🔹 1) SAFE PUBLIC INITIAL FETCH (no token required)
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const res = await fetch(`${API_BASE}/api/logs?limit=80`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!res.ok) {
                    console.error("IncidentTrend initial fetch failed:", res.status);
                    return;
                }

                const json = await res.json();

                if (!json || !Array.isArray(json.logs)) {
                    console.error("IncidentTrend: invalid logs payload", json);
                    return;
                }

                const formatted = json.logs.map((l) => ({
                    time: formatTime(l.ts),
                    severity: (l.severity || "info").toLowerCase(),
                }));

                if (!cancelled) {
                    setData(formatted.reverse());
                }
            } catch (e) {
                console.error("IncidentTrend load error", e);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    // 🔹 2) SOCKET.IO – optional, never allowed to crash
    useEffect(() => {
        let socket;

        try {
            socket = io(SOCKET_URL, {
                transports: ["websocket"],
            });

            socket.on("connect", () => {
                console.log("IncidentTrend socket connected");
                setSocketOk(true);
            });

            socket.on("connect_error", (err) => {
                console.warn("IncidentTrend socket connect_error:", err.message);
                setSocketOk(false);
            });

            socket.on("alert:batch", (batch = []) => {
                try {
                    const formatted = batch.map((l) => ({
                        time: formatTime(l.ts),
                        severity: (l.severity || "info").toLowerCase(),
                    }));

                    setData((prev) => [...prev.slice(-200), ...formatted]);
                } catch (err) {
                    console.error("IncidentTrend socket batch parse error:", err);
                }
            });
        } catch (err) {
            console.error("IncidentTrend socket setup failed:", err);
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    // 🔹 3) FILTER + GROUPING (defensive)
    const filtered = data.filter((i) => {
        if (!i) return false;
        if (filter === "all") return true;
        return i.severity === filter;
    });

    const grouped = {};
    filtered.forEach((item) => {
        if (!item.time) return;
        grouped[item.time] = (grouped[item.time] || 0) + 1;
    });

    const chartData = Object.keys(grouped).map((t) => ({
        time: t,
        count: grouped[t],
    }));

    return (
        <div className="w-full">
            <div className="w-full h-72">
                <ResponsiveContainer>
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />

                        <XAxis
                            dataKey="time"
                            tick={{ fill: "#aaa", fontSize: 11 }}
                            interval={Math.floor((chartData.length || 1) / 6)}
                        />

                        <YAxis
                            tick={{ fill: "#aaa" }}
                            allowDecimals={false}
                        />

                        <Tooltip
                            contentStyle={{
                                background: "#111",
                                border: "1px solid #555",
                                borderRadius: "8px",
                            }}
                            labelStyle={{ color: "#fff" }}
                            formatter={(v) => [`${v} alerts`, "Count"]}
                        />

                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#00d0ff"
                            strokeWidth={3}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* FILTER BUTTONS */}
            <div className="flex gap-4 mt-4 justify-center">
                <button
                    className={`px-4 py-1 rounded-full border 
            ${filter === "error"
                            ? "bg-red-600 text-white"
                            : "bg-black/40 text-red-400"
                        }`}
                    onClick={() => setFilter("error")}
                >
                    Errors
                </button>

                <button
                    className={`px-4 py-1 rounded-full border 
            ${filter === "info"
                            ? "bg-blue-600 text-white"
                            : "bg-black/40 text-blue-400"
                        }`}
                    onClick={() => setFilter("info")}
                >
                    Info
                </button>

                <button
                    className={`px-4 py-1 rounded-full border 
            ${filter === "warning"
                            ? "bg-yellow-500 text-black"
                            : "bg-black/40 text-yellow-400"
                        }`}
                    onClick={() => setFilter("warning")}
                >
                    Warnings
                </button>

                <button
                    className={`px-4 py-1 rounded-full border 
            ${filter === "all"
                            ? "bg-gray-500 text-white"
                            : "bg-black/40 text-gray-300"
                        }`}
                    onClick={() => setFilter("all")}
                >
                    All
                </button>
            </div>

            {!socketOk && (
                <p className="mt-2 text-xs text-center text-yellow-400 opacity-70">
                    Live stream offline – showing last ingested logs only.
                </p>
            )}
        </div>
    );
}
