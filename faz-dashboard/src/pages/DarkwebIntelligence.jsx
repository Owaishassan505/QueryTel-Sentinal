import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";

export default function DarkwebIntelligence() {
    const [headlines, setHeadlines] = useState([]);
    const [intel, setIntel] = useState(null);
    const [liveFeed, setLiveFeed] = useState([]);

    const token = localStorage.getItem("token");

    // Fetch static intelligence summary + chart
    const fetchIntelligence = async () => {
        try {
            const res = await axios.get("/api/darkweb/intelligence", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIntel(res.data);
        } catch (err) {
            console.error("Darkweb Intelligence Error:", err);
        }
    };



    const exportCSV = () => {
        const rows = headlines.map(h => ({
            title: h.title,
            source: h.source,
            date: h.date,
            link: h.link,
            exposure: h.exposure ? "YES" : "NO"
        }));

        let csv = "Title,Source,Date,Exposure,Link\n";
        rows.forEach(r => {
            csv += `"${r.title}","${r.source}","${r.date}",${r.exposure},"${r.link}"\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "darkweb_intelligence.csv";
        a.click();
    };

    const exportPDF = () => {
        window.print(); // simplest built-in PDF mechanism
    };

    const [score, setScore] = useState(0);


    function calculateThreatScore(headlines) {
        let score = 0;

        headlines.forEach(h => {
            if (h.exposure) score += 20;
            if (/million|database dump|critical/.test(h.title.toLowerCase())) score += 15;
            if (/credentials|password|pwd|pass=/.test(h.title.toLowerCase())) score += 10;
        });

        return Math.min(score, 100);
    }

    function ThreatScoreWidget({ score }) {

        // Determine color + level text
        let color = "text-green-400";
        let level = "Low Risk";

        if (score >= 30) { color = "text-yellow-400"; level = "Medium Risk"; }
        if (score >= 60) { color = "text-orange-400"; level = "High Risk"; }
        if (score >= 80) { color = "text-red-500"; level = "Critical Risk"; }

        return (
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl text-center">

                <h2 className="text-xl font-bold text-white mb-3">Darkweb Threat Score</h2>

                <div className="flex justify-center mb-3">
                    <div
                        className={`
                        relative w-36 h-36 rounded-full flex items-center justify-center 
                        transition-all duration-700 
                        ${score >= 80 ? "animate-pulse" : ""}
                    `}
                        style={{
                            background: `conic-gradient(
                            ${score >= 80 ? "#ff1a1a" :
                                    score >= 60 ? "#ff7700" :
                                        score >= 30 ? "#ffdd33" :
                                            "#22c55e"} ${score * 3.6}deg,
                            #1f2937 0deg
                        )`
                        }}
                    >
                        <div className="absolute w-28 h-28 bg-gray-900 rounded-full flex items-center justify-center">
                            <span className={`text-3xl font-extrabold ${color}`}>{score}</span>
                        </div>
                    </div>
                </div>

                <p className={`font-semibold text-lg ${color}`}>{level}</p>
                <p className="text-gray-400 text-sm mt-2">Score based on breach intensity & credential exposure</p>
            </div>
        );
    }



    // Fetch OSINT breach headlines
    const fetchHeadlines = async () => {
        try {
            const res = await axios.get("/api/darkweb/headlines", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const items = res.data.items || [];

            // 🔥 Detect exposures
            items.forEach(i => {
                i.exposure = /querytel|@querytel\.com|password|credentials|pwd=|pass=/i.test(
                    `${i.title} ${i.content || ""}`
                );
            });

            setHeadlines(items);

            // 🔥 AUTO-CALCULATE THREAT SCORE
            const newScore = calculateThreatScore(items);
            setScore(newScore);

        } catch (err) {
            console.error("Headlines Error:", err);
        }
    };




    // Setup Live Stream Socket
    useEffect(() => {
        const socket = io("/", {
            auth: { token },
            transports: ["websocket"]
        });

        socket.on("darkweb:update", (data) => {
            setLiveFeed((prev) => [data, ...prev.slice(0, 20)]);
        });

        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        fetchIntelligence();
        fetchHeadlines();
    }, []);

    return (
        <div className="p-6 space-y-10">
            {/* ---- TITLE ---- */}
            <h1 className="text-3xl font-bold text-white">Darkweb Intelligence</h1>

            {/* ---- SUMMARY ---- */}
            {intel && (
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-2">AI Summary</h2>
                    <p className="text-gray-300">{intel.summary}</p>
                </div>
            )}

            <ThreatScoreWidget score={score} />

            {/* ---- CHART ---- */}
            {intel && (
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Breach Activity by Source</h2>
                    <div className="h-72">
                        <ResponsiveContainer>
                            <BarChart data={intel.chartData}>
                                <XAxis dataKey="source" tick={{ fill: "#bbb" }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="breaches" fill="#ff4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ---- HEADLINES ---- */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">Latest Breach Headlines</h2>

                {headlines.map((h, idx) => (
                    <div
                        key={idx}
                        className="bg-gray-800 p-4 rounded-xl border border-gray-700"
                    >
                        <h3 className="text-lg font-semibold text-white">{h.title}</h3>

                        {/* 🔥 EXPOSURE BADGE */}
                        {h.exposure && (
                            <span className="text-red-400 font-bold text-sm block mt-1">
                                ⚠ Credential Exposure Detected
                            </span>
                        )}

                        <p className="text-gray-400 text-sm">{h.source}</p>
                        <p className="text-gray-500 text-xs mt-1">{h.date}</p>

                        <a
                            href={h.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline text-sm mt-2 inline-block"
                        >
                            View Source →
                        </a>
                    </div>
                ))}
                {headlines.length > 0 && (
                    <div className="mt-4">
                        <button
                            onClick={exportCSV}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg mr-2"
                        >
                            Export CSV
                        </button>
                    </div>
                )}
            </div>


            {/* ---- LIVE FEED ---- */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">Live Darkweb Activity</h2>

                {liveFeed.length === 0 ? (
                    <p className="text-gray-400">Waiting for live activity...</p>
                ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {liveFeed.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-gray-300"
                            >
                                <div className="flex justify-between">
                                    <span className="font-semibold">{item.source}</span>
                                    <span className="text-sm text-gray-400">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-red-400 font-bold">
                                    {item.breaches} Breaches Reported
                                </p>

                                <button onClick={exportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                                    Export CSV
                                </button>

                                <button onClick={exportPDF} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                                    Export PDF
                                </button>



                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

