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
import { Globe, ShieldAlert, ArrowRight, Activity } from "lucide-react";

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
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* ---- TITLE ---- */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <Globe className="w-8 h-8 text-red-500 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Darkweb Intelligence</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Global Breach & Leak Monitoring</p>
                </div>
            </div>

            {/* ---- SUMMARY ---- */}
            {intel && (
                <div className="bg-[#0f172a]/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors"></div>
                    <h2 className="text-xl font-black text-white mb-4 uppercase tracking-tighter italic">AI Analysis Report</h2>
                    <p className="text-slate-300 leading-relaxed font-medium">{intel.summary}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    <ThreatScoreWidget score={score} />
                </div>

                <div className="lg:col-span-8">
                    {/* ---- CHART ---- */}
                    {intel && (
                        <div className="bg-[#0f172a]/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 shadow-2xl h-full">
                            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tighter italic">Breach Activity by Source</h2>
                            <div className="h-64">
                                <ResponsiveContainer>
                                    <BarChart data={intel.chartData}>
                                        <XAxis dataKey="source" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }}
                                        />
                                        <Bar dataKey="breaches" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ---- HEADLINES ---- */}
            <div className="bg-[#0f172a]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Latest Breach Intelligence</h2>
                    {headlines.length > 0 && (
                        <button
                            onClick={exportCSV}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-500 transition-all"
                        >
                            Export Intelligence Audit
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {headlines.map((h, idx) => (
                        <div
                            key={idx}
                            className="bg-black/20 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden"
                        >
                            {h.exposure && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-3xl"></div>}
                            <h3 className="text-base font-bold text-white leading-tight">{h.title}</h3>

                            {/* 🔥 EXPOSURE BADGE */}
                            {h.exposure && (
                                <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 w-fit">
                                    <ShieldAlert className="w-3 h-3 text-red-500 animate-pulse" />
                                    <span className="text-red-400 font-black text-[9px] uppercase tracking-widest">Credential Exposure Detected</span>
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase">{h.source}</span>
                                <span className="text-[10px] font-mono font-bold text-slate-600">{h.date}</span>
                            </div>

                            <a
                                href={h.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 flex items-center gap-2 text-blue-500 font-bold text-[10px] uppercase tracking-widest hover:text-blue-400 transition-colors"
                            >
                                Investigate Source <ArrowRight className="w-3 h-3" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>


            {/* ---- LIVE FEED ---- */}
            <div className="bg-[#0f172a]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Live Darkweb Ingress</h2>
                </div>

                {liveFeed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Activity className="w-12 h-12 text-slate-700 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 text-slate-500">Monitoring Encrypted Networks...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liveFeed.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-black/40 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-black text-slate-300 uppercase">{item.source}</span>
                                    <span className="text-[10px] font-mono font-bold text-slate-600">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>

                                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 mb-4 text-center">
                                    <p className="text-lg font-black text-red-400 tracking-tighter leading-none">{item.breaches}</p>
                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">Breaches Detected</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={exportCSV} className="p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all">
                                        CSV Audit
                                    </button>
                                    <button onClick={exportPDF} className="p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all">
                                        PDF Report
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

