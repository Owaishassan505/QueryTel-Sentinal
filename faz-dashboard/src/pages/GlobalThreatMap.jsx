import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "../api/api";
import {
    ShieldAlert, Globe as GlobeIcon, Activity,
    Crosshair, Zap, AlertCircle, TrendingUp,
    ChevronRight, Terminal, Radar
} from "lucide-react";

export default function GlobalThreatMap() {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const arcsLayer = useRef(null);
    const [feed, setFeed] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [stats, setStats] = useState({
        scanned: 14205,
        detected: 842,
        blocked: 729
    });

    const COLOR_PALETTE = {
        critical: "#ff3e3e",
        warning: "#ffd12b",
        info: "#00d4ff",
        secure: "#00ff9d"
    };

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current, {
            center: [30, 0],
            zoom: 2.5,
            zoomControl: false,
            attributionControl: false,
            maxBounds: [[-85, -180], [85, 180]],
            minZoom: 2,
            scrollWheelZoom: true,
            dragging: true,
        });

        // Base Dark Tiles (no labels)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            opacity: 1,
            zIndex: 1
        }).addTo(map);

        // Labels Layer - High contrast, always on top of base map
        const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            opacity: 1,
            zIndex: 650,  // Higher than base tiles, lower than overlays
            pane: 'overlayPane'
        }).addTo(map);

        // Attack layers (will be above labels)
        arcsLayer.current = L.layerGroup().addTo(map);

        mapInstance.current = map;

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Create a quadratic bezier curve for the arc
    const createArcPoints = (start, end, pointsCount = 30) => {
        const p1 = [start[0], start[1]];
        const p3 = [end[0], end[1]];

        // Midpoint with high vertical offset for "ballistic" look
        const midLat = (p1[0] + p3[0]) / 2;
        const midLng = (p1[1] + p3[1]) / 2;
        const dist = Math.sqrt(Math.pow(p3[0] - p1[0], 2) + Math.pow(p3[1] - p1[1], 2));
        const offset = Math.max(dist * 0.4, 15); // Powerful curve
        const p2 = [midLat + offset, midLng];

        const points = [];
        for (let i = 0; i <= pointsCount; i++) {
            const t = i / pointsCount;
            const lat = (1 - t) * (1 - t) * p1[0] + 2 * (1 - t) * t * p2[0] + t * t * p3[0];
            const lng = (1 - t) * (1 - t) * p1[1] + 2 * (1 - t) * t * p2[1] + t * t * p3[1];
            points.push([lat, lng]);
        }
        return points;
    };

    const drawBallisticAttack = (start, end, severity) => {
        if (!mapInstance.current || !arcsLayer.current) return;

        const color = COLOR_PALETTE[severity.toLowerCase()] || COLOR_PALETTE.info;
        const points = createArcPoints(start, end);

        // 1. Static Path (Translucent Trail)
        const staticPath = L.polyline(points, {
            color: color,
            weight: 1,
            opacity: 0.15,
            smoothFactor: 2
        }).addTo(arcsLayer.current);

        // 2. The Rocket/Comet (Leading Segment)
        // We use a custom SVG filter for the glowing head effect
        const rocketLine = L.polyline(points, {
            color: color,
            weight: 2,
            opacity: 0.8,
            className: 'rocket-attack-path',
            smoothFactor: 2
        }).addTo(arcsLayer.current);

        // 3. Impact Bloom
        setTimeout(() => {
            const impactIcon = L.divIcon({
                className: 'attack-impact-container',
                html: `<div class="impact-bloom" style="--impact-color: ${color}"></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            const impact = L.marker(end, { icon: impactIcon }).addTo(arcsLayer.current);

            setTimeout(() => {
                if (arcsLayer.current) {
                    arcsLayer.current.removeLayer(staticPath);
                    arcsLayer.current.removeLayer(rocketLine);
                    arcsLayer.current.removeLayer(impact);
                }
            }, 3000);
        }, 1800); // Wait for rocket travel
    };

    const loadData = async () => {
        try {
            const { ok, data } = await apiFetch("/api/soc/attack-map?limit=25");
            if (ok && data.logs) {
                const validLogs = data.logs; // Backend already filters for geo data
                setFeed(prev => [...validLogs, ...prev].slice(0, 50));

                if (validLogs.length > 0) {
                    // Logic for "Threat Alert" Zoom
                    const criticalAttack = validLogs.find(l => l.severity === 'critical');
                    if (criticalAttack && mapInstance.current) {
                        mapInstance.current.flyTo([criticalAttack.dstLat, criticalAttack.dstLng], 4, {
                            animate: true,
                            duration: 3
                        });
                    }

                    // Stagger launches
                    validLogs.forEach((l, idx) => {
                        setTimeout(() => {
                            if (l.srcLat && l.srcLng && l.dstLat && l.dstLng) {
                                drawBallisticAttack([l.srcLat, l.srcLng], [l.dstLat, l.dstLng], l.severity);
                            }
                        }, idx * 450);
                    });
                }

                setStats(prev => ({
                    scanned: prev.scanned + 128,
                    detected: prev.detected + validLogs.length,
                    blocked: prev.blocked + validLogs.length
                }));
            }
        } catch (err) {
            console.error("SOC Map Fetch Failed", err);
        }
    };

    // Separate Camera Loop to avoid dependency conflicts
    useEffect(() => {
        let timer;
        const cycle = async () => {
            if (!mapInstance.current || feed.length === 0) return;

            const randomAttack = feed[Math.floor(Math.random() * feed.length)];
            if (randomAttack && randomAttack.dstLat) {
                mapInstance.current.flyTo([randomAttack.dstLat, randomAttack.dstLng], 5, {
                    animate: true,
                    duration: 3
                });
                await new Promise(r => setTimeout(r, 6000));
                if (mapInstance.current) {
                    mapInstance.current.flyTo([30, 0], 2.5, {
                        animate: true,
                        duration: 3
                    });
                }
            }
        };

        const interval = setInterval(cycle, 15000);
        return () => clearInterval(interval);
    }, [feed.length > 0]); // Only re-run if feed state transitions from empty to populated

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 7000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-screen bg-[#020617] overflow-hidden font-sans">
            {/* VECTOR MAP AREA */}
            <div ref={mapRef} className="absolute inset-0 z-0 bg-[#050810]" />

            {/* RADWARE-STYLE GRID & SCANNER - Reduced opacity to not block labels */}
            <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.4)_100%)]" />
            <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-scanning-matrix z-[2]" />

            {/* COMMAND SIDE PANEL: LEFT BOTTOM */}
            <div className="absolute bottom-40 left-8 z-10 space-y-4 pointer-events-none">
                <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-5 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                            <Radar className="w-6 h-6 text-blue-400 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white tracking-widest uppercase italic leading-tight">Live Threat Map</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Operational</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div
                            className="space-y-0.5 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors pointer-events-auto"
                            onClick={() => setActiveTab('nodes')}
                        >
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Nodes</p>
                            <p className="text-xl font-black text-white mono tracking-tighter">{stats.scanned.toLocaleString()}</p>
                        </div>
                        <div
                            className="space-y-0.5 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors pointer-events-auto"
                            onClick={() => setActiveTab('blocked')}
                        >
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Attacks Blocked</p>
                            <p className="text-xl font-black text-red-500 mono tracking-tighter">{stats.blocked.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div
                    className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-white/5 w-72 space-y-3 pointer-events-auto shadow-2xl"
                >
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3 text-blue-500" /> Distribution
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 cursor-pointer hover:scale-105 transition-transform shrink-0" onClick={() => setActiveTab('distribution')}>
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="4"></circle>
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="42, 100" strokeDashoffset="25"></circle>
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="28, 100" strokeDashoffset="83"></circle>
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="111"></circle>
                            </svg>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            {[
                                { label: 'DDoS', val: 42, color: 'bg-red-500' },
                                { label: 'Web', val: 28, color: 'bg-orange-500' },
                                { label: 'Vuln', val: 15, color: 'bg-blue-500' }
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between items-center text-[7px] font-bold text-slate-300 uppercase cursor-pointer hover:text-white transition-colors"
                                    onClick={() => {
                                        setActiveTab('distribution');
                                        setSelectedDetail(item.label);
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        <div className={`w-1 h-1 rounded-full ${item.color}`}></div>
                                        <span>{item.label}</span>
                                    </div>
                                    <span>{item.val}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE DATA STREAM: RIGHT */}
            <div className="absolute top-8 right-8 bottom-36 w-80 z-10 pointer-events-none">
                <div className="h-full bg-[#0f172a]/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 pointer-events-auto shadow-2xl flex flex-col overflow-hidden max-h-[calc(100vh-12rem)]">
                    <div className="p-5 bg-slate-900/50 border-b border-white/5 flex items-center justify-between shrink-0">
                        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Intelligence Feed</h2>
                        <span className="text-[7px] px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded font-black">LIVE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                        {feed.map((l, i) => (
                            <div key={i} className="bg-white/5 p-3.5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group shrink-0">
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md ${l.severity === 'critical' ? 'text-red-400 bg-red-400/10' : 'text-blue-400 bg-blue-400/10'
                                        }`}>
                                        {l.severity}
                                    </span>
                                    <span className="text-[7px] font-mono text-slate-600 font-bold">{new Date().toLocaleTimeString()}</span>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-100 group-hover:text-blue-400 transition-colors uppercase truncate">{l.deviceName || 'QueryTel_Edge'}</p>
                                    <p className="text-[8px] text-slate-500 font-mono tracking-tighter truncate">{l.sourceIp} → {l.destIp}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TACTICAL AWARENESS LINE: CENTER BOTTOM */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[20] flex flex-col items-center pointer-events-none w-max">
                <div className="h-[3px] w-[500px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_30px_rgba(59,130,246,0.6)] animate-pulse" />
                <div className="mt-5 px-12 py-4 bg-[#0f172a]/95 backdrop-blur-3xl rounded-full border border-white/10 flex items-center gap-12 shadow-[0_0_60px_rgba(0,0,0,0.8)] pointer-events-auto ring-1 ring-white/10">
                    <div className="flex flex-col items-center">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-0.5 italic">Tactical Awareness</p>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-white italic tracking-tighter">99.98%</span>
                            <span className="text-[8px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-black tracking-widest">OPERATIONAL</span>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-0.5 italic">Network Throughput</p>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-white italic tracking-tighter">2.4 GB/s</span>
                            <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black tracking-widest">SECURED</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAIL MODAL OVERLAY */}
            {activeTab && (
                <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-4xl h-[70vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest">
                                    {activeTab === 'blocked' && 'Blocked Attacks Log'}
                                    {activeTab === 'nodes' && 'Active Node Registry'}
                                    {activeTab === 'distribution' && 'Threat Vector Distribution'}
                                </h3>
                                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">Real-time Intelligence Data</p>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveTab(null);
                                    setSelectedDetail(null);
                                }}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                            >
                                <Zap className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {activeTab === 'blocked' && (
                                <div className="space-y-4">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black border-b border-white/5">
                                                <th className="pb-4">Timestamp</th>
                                                <th className="pb-4">Severity</th>
                                                <th className="pb-4">Source IP</th>
                                                <th className="pb-4">Destination</th>
                                                <th className="pb-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs font-mono">
                                            {feed.map((l, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                    <td className="py-4 text-slate-400">{new Date().toLocaleTimeString()}</td>
                                                    <td className="py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${l.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                            {l.severity.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-white font-bold">{l.sourceIp}</td>
                                                    <td className="py-4 text-slate-300">{l.destIp}</td>
                                                    <td className="py-4 text-emerald-500 font-black">BLOCKED</td>
                                                </tr>
                                            ))}
                                            {/* Dummy data to fill */}
                                            {[...Array(5)].map((_, i) => (
                                                <tr key={`d-${i}`} className="border-b border-white/5 opacity-50">
                                                    <td className="py-4 text-slate-400">14:2{i}:15</td>
                                                    <td className="py-4"><span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[9px] font-black">CRITICAL</span></td>
                                                    <td className="py-4 text-white font-bold">192.168.1.{100 + i}</td>
                                                    <td className="py-4 text-slate-300">US-EAST-1</td>
                                                    <td className="py-4 text-emerald-500 font-black">BLOCKED</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'nodes' && (
                                <div className="grid grid-cols-3 gap-6">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                    <GlobeIcon className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-500">ACTIVE</span>
                                            </div>
                                            <p className="text-white font-black text-sm mb-1 uppercase tracking-tighter">QueryTel_Node_{100 + i}</p>
                                            <p className="text-slate-500 text-[10px] font-mono">10.0.{i}.254</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'distribution' && (
                                <div className="flex flex-col h-full">
                                    {/* Sub-tabs for specific distributions */}
                                    <div className="flex gap-4 mb-8">
                                        {['All', 'DDoS', 'Web', 'Vuln'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedDetail(type === 'All' ? null : type)}
                                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${(selectedDetail === type || (type === 'All' && !selectedDetail))
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                                                    }`}
                                            >
                                                {type} Vectors
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-12 items-center flex-1">
                                        <div className="flex justify-center">
                                            <div className="relative w-64 h-64">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="3"></circle>
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="42, 100" strokeDashoffset="0" className={`drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-opacity duration-300 ${(!selectedDetail || selectedDetail === 'DDoS') ? 'opacity-100' : 'opacity-20'}`}></circle>
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="28, 100" strokeDashoffset="-42" className={`drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-opacity duration-300 ${(!selectedDetail || selectedDetail === 'Web') ? 'opacity-100' : 'opacity-20'}`}></circle>
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="15, 100" strokeDashoffset="-70" className={`drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-opacity duration-300 ${(!selectedDetail || selectedDetail === 'Vuln') ? 'opacity-100' : 'opacity-20'}`}></circle>
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-4xl font-black text-white italic">{selectedDetail === 'DDoS' ? '42%' : selectedDetail === 'Web' ? '28%' : selectedDetail === 'Vuln' ? '15%' : '85%'}</span>
                                                    <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase mt-1">
                                                        {selectedDetail ? `${selectedDetail} Threat` : 'Total Risk'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            {[
                                                { label: 'DDoS Attacks', id: 'DDoS', val: 42, color: 'bg-red-500', desc: 'Volumetric traffic spikes targeted at edge nodes. Common sources: Botnets, Amplification vectors.' },
                                                { label: 'Web Explorers', id: 'Web', val: 28, color: 'bg-orange-500', desc: 'Automated scanners searching for SQLi, XSS, and directory traversal vulnerabilities in edge applications.' },
                                                { label: 'App Vulnerabilities', id: 'Vuln', val: 15, color: 'bg-blue-500', desc: 'Known exploit attempts targeted at legacy systems and unpatched network appliance interfaces.' }
                                            ].filter(item => !selectedDetail || item.id === selectedDetail).map((item, i) => (
                                                <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5 animate-in slide-in-from-right duration-500">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_10px_currentColor]`}></div>
                                                            <span className="text-sm font-black text-white uppercase italic tracking-widest">{item.label}</span>
                                                        </div>
                                                        <span className="text-xl font-mono font-black text-white">{item.val}%</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium uppercase italic tracking-wider">{item.desc}</p>
                                                    <div className="mt-6 flex gap-3">
                                                        <div className="px-4 py-1.5 bg-white/5 rounded-lg border border-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Monitoring</div>
                                                        <div className="px-4 py-1.5 bg-red-500/10 rounded-lg border border-red-500/10 text-[8px] font-black text-red-400 uppercase tracking-widest underline decoration-red-500/30">View Payload Logs</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        className="absolute inset-0 -z-10 cursor-pointer"
                        onClick={() => {
                            setActiveTab(null);
                            setSelectedDetail(null);
                        }}
                    ></div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-scanning-matrix { animation: scan-v 12s linear infinite; }
                @keyframes scan-v { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }

                .animate-in { animation-duration: 500ms; animation-fill-mode: both; }
                .fade-in { animation-name: fade; }
                .zoom-in-95 { animation-name: zoom; }
                @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoom { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

                .rocket-attack-path {
                    stroke-dasharray: 50, 5000;
                    stroke-dashoffset: 5050;
                    animation: rocket-fly 2.2s ease-in-out forwards;
                    filter: drop-shadow(0 0 12px currentColor);
                }
                @keyframes rocket-fly {
                    0% { stroke-dashoffset: 5050; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { stroke-dashoffset: 0; opacity: 0; }
                }

                .impact-bloom {
                    width: 8px;
                    height: 8px;
                    background: var(--impact-color);
                    border-radius: 50%;
                    box-shadow: 0 0 20px var(--impact-color);
                    position: relative;
                }
                .impact-bloom::after {
                    content: '';
                    position: absolute;
                    inset: -20px;
                    border: 2px solid var(--impact-color);
                    border-radius: 50%;
                    animation: bloom-out 1.2s ease-out infinite;
                }
                @keyframes bloom-out {
                    0% { transform: scale(0.2); opacity: 1; }
                    100% { transform: scale(3); opacity: 0; }
                }

                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
                .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
                
                /* Leaflet Container Styling */
                .leaflet-container { 
                    background: transparent !important; 
                }
                
                /* Ensure labels are visible - Critical for map readability */
                .leaflet-tile-pane { z-index: 200 !important; }
                .leaflet-overlay-pane { z-index: 400 !important; }
                .leaflet-shadow-pane { z-index: 500 !important; }
                .leaflet-marker-pane { z-index: 600 !important; }
                .leaflet-tooltip-pane { z-index: 650 !important; }
                .leaflet-popup-pane { z-index: 700 !important; }
            ` }} />
        </div>
    );
}
