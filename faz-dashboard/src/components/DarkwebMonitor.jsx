import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const socket = io("http://10.106.87.146:3320", { transports: ["websocket"] });

export default function DarkwebMonitor() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState("");
    const [chartData, setChartData] = useState([]);
    const [status, setStatus] = useState("Disconnected");
    const [feed, setFeed] = useState([]);
    const [newAlertPulse, setNewAlertPulse] = useState(false);
    const feedEndRef = useRef(null);

    // 🆕 OSINT Headlines Feed States
    const [headlines, setHeadlines] = useState([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const headlineListRef = useRef(null);

    // 🆕 Fetch Real Darkweb Headlines (OSINT Feeds)
    useEffect(() => {
        async function fetchHeadlines() {
            try {
                const res = await fetch("http://10.106.87.146:3320/api/darkweb/headlines");
                const json = await res.json();
                if (Array.isArray(json?.items)) setHeadlines(json.items);
            } catch (e) {
                console.error("Failed to fetch headlines:", e);
            }
        }

        fetchHeadlines();

        socket.on("darkweb:headline", (headline) => {
            setHeadlines((prev) => {
                const dedup = new Map((prev || []).map((h) => [h.link, h]));
                dedup.set(headline.link, headline);
                return Array.from(dedup.values())
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 100);
            });
            smoothScrollToBottom();
        });

        return () => socket.off("darkweb:headline");
    }, []);

    // 🔁 Smooth auto-scroll for headlines
    function smoothScrollToBottom() {
        if (!autoScroll || !headlineListRef.current) return;
        headlineListRef.current.scrollTo({
            top: headlineListRef.current.scrollHeight,
            behavior: "smooth",
        });
    }

    // Fetch Intelligence Summary
    useEffect(() => {
        const fetchDarkwebIntel = async () => {
            try {
                const res = await fetch("http://10.106.87.146:3320/api/darkweb/intelligence");
                const data = await res.json();
                setSummary(data.summary || "No darkweb findings.");
                setChartData(data.chartData || []);
                setStatus("Connected");
            } catch (err) {
                console.error("❌ Failed to load Darkweb Intelligence:", err);
                setSummary("Unable to load Darkweb data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDarkwebIntel();

        // ✅ Socket listeners
        socket.on("connect", () => setStatus("Connected"));
        socket.on("disconnect", () => setStatus("Disconnected"));

        socket.on("darkweb:update", (update) => {
            setChartData((prev) =>
                prev.map((item) =>
                    item.source === update.source
                        ? { ...item, breaches: update.breaches }
                        : item
                )
            );

            const newAlert = {
                source: update.source,
                breaches: update.breaches,
                time: new Date(update.timestamp).toLocaleTimeString(),
            };

            setFeed((prev) => [...prev, newAlert].slice(-50));
            setNewAlertPulse(true);
            setTimeout(() => setNewAlertPulse(false), 1500);
        });

        return () => {
            socket.off("darkweb:update");
            socket.off("connect");
            socket.off("disconnect");
        };
    }, []);

    // 🔁 Auto-scroll feed to bottom when new alert arrives
    useEffect(() => {
        if (feedEndRef.current) {
            feedEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [feed]);

    if (loading)
        return <div className="text-center mt-10 text-gray-400">Loading...</div>;

    return (
        <div className="p-6 space-y-6 text-white">
            {/* Header */}
            <div className="shadow-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        🕵️ Darkweb Intelligence
                    </h2>
                    <div
                        className={`text-sm px-2 py-1 rounded-lg transition ${status === "Connected"
                            ? "bg-green-600/40 text-green-300"
                            : "bg-red-600/40 text-red-300"
                            }`}
                    >
                        {status}
                    </div>
                </div>
                <p className="text-gray-300">{summary}</p>
            </div>

            {/* Chart */}
            <div className="shadow-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5">
                <h2 className="text-lg font-semibold mb-4 text-cyan-300">
                    Recent Breach Sources
                </h2>
                <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <XAxis dataKey="source" stroke="#aaa" />
                            <YAxis stroke="#aaa" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e293b",
                                    border: "1px solid #475569",
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="breaches"
                                stroke="#fbbf24"
                                strokeWidth={2}
                                dot={{ r: 4, fill: "#facc15" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Live Feed */}
            <div className="shadow-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                        🔥 Live Darkweb Alerts
                        {newAlertPulse && (
                            <span className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span>
                        )}
                    </h2>
                </div>

                <div className="max-h-80 overflow-y-auto pr-2 space-y-2 scroll-smooth">
                    {feed.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">
                            No new darkweb activity detected yet...
                        </p>
                    ) : (
                        feed.map((alert, i) => (
                            <div
                                key={i}
                                className={`flex justify-between items-center bg-gray-800/60 transition-all duration-500 ease-in-out p-3 rounded-lg ${i === feed.length - 1 ? "animate-slide-in" : ""
                                    }`}
                            >
                                <div>
                                    <span className="font-semibold text-yellow-400">
                                        {alert.source}
                                    </span>
                                    <span className="text-gray-400 text-sm ml-2">
                                        Breaches: {alert.breaches}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">{alert.time}</span>
                            </div>
                        ))
                    )}
                    <div ref={feedEndRef}></div>
                </div>
            </div>

            {/* 🧠 Real OSINT Headlines */}
            <div className="shadow-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                        🌐 Darkweb Headlines Feed
                    </h2>
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg"
                    >
                        {autoScroll ? "⏸ Pause Scroll" : "▶ Resume Scroll"}
                    </button>
                </div>

                <div
                    ref={headlineListRef}
                    className="max-h-96 overflow-y-auto pr-2 space-y-3 scroll-smooth"
                >
                    {headlines.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">
                            No headlines yet...
                        </p>
                    ) : (
                        headlines.map((h, i) => (
                            <div
                                key={i}
                                className="p-3 rounded-lg bg-gray-800/60 hover:bg-gray-800 transition-all duration-300"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-cyan-400">
                                            {h.source}
                                        </h3>
                                        <a
                                            href={h.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-300 hover:text-yellow-300 text-sm"
                                        >
                                            {h.title}
                                        </a>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(h.date).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-in {
                    animation: slideIn 0.4s ease-out;
                }
            `}</style>
        </div>
    );
}
