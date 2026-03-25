import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendURL } from "../config";
import {
    Fingerprint, Cpu, ShieldCheck, Monitor,
    Activity, Search, RefreshCw, AlertCircle,
    User, HardDrive, Smartphone, Laptop, Globe,
    LayoutGrid, List
} from "lucide-react";
import DonutChart from "../components/Charts/DonutChart";
import BarChart from "../components/Charts/BarChart";

export default function AssetIdentity() {
    const [data, setData] = useState({
        charts: {
            detectionMethods: [],
            detectionSources: [],
            identityStatus: [],
            osDistribution: []
        },
        assets: []
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendURL}/api/soc/asset-identity`);
            if (res.data) {
                setData(res.data);
            }
        } catch (err) {
            console.error("Asset Identity fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 300000); // 5 min refresh
        return () => clearInterval(interval);
    }, []);

    const filteredAssets = data.assets.filter(a =>
        (a.ip || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.user || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.mac || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
    const paginatedAssets = filteredAssets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30">
            <div className="px-6 pb-6 pt-0 space-y-6">

                {/* HEADER / STATUS BAR */}
                <div className="bg-gradient-to-r from-slate-900/60 via-blue-900/20 to-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] py-4 px-6 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                            <Monitor className="w-6 h-6 text-blue-500 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">
                                ASSET IDENTITY <span className="text-blue-500">CENTER</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                    <Activity className="w-2.5 h-2.5" /> ENDPOINT INTELIIGENCE ACTIVE
                                </span>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">•</span>
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">REAL-TIME CORRELATION: ON</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex flex-col items-end border-r border-white/10 pr-6">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Assets</p>
                            <p className="text-lg font-black text-white italic">{data.assets.length}</p>
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="bg-blue-600 text-white rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 flex items-center gap-2"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Refreshing...' : 'Refresh Unit'}
                        </button>
                    </div>
                </div>

                {/* ANALYTICAL GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl transition-all hover:border-blue-500/20">
                        <DonutChart
                            title="Detection Method"
                            data={data.charts.detectionMethods.length > 0 ? data.charts.detectionMethods : [{ name: 'Loading...', value: 1 }]}
                            colors={["#3b82f6", "#d946ef", "#6366f1", "#10b981"]}
                        />
                    </div>
                    <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl transition-all hover:border-blue-500/20">
                        <BarChart
                            title="Detection Source"
                            data={data.charts.detectionSources.length > 0 ? data.charts.detectionSources : [{ name: 'Loading...', value: 0 }]}
                            color="#3b82f6"
                        />
                    </div>
                    <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl transition-all hover:border-blue-500/20">
                        <DonutChart
                            title="Identified/Unidentified"
                            data={data.charts.identityStatus.length > 0 ? data.charts.identityStatus : [{ name: 'Loading...', value: 1 }]}
                            colors={["#f59e0b", "#3b82f6"]}
                        />
                    </div>
                    <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl transition-all hover:border-blue-500/20">
                        <BarChart
                            title="Hardware/OS Distribution"
                            data={data.charts.osDistribution.length > 0 ? data.charts.osDistribution : [{ name: 'Loading...', value: 0 }]}
                            color="#8b5cf6"
                        />
                    </div>
                </div>

                {/* ASSET INTELLIGENCE MATRIX */}
                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Asset Intelligence Matrix</h3>
                            <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1 uppercase flex items-center gap-2">
                                <LayoutGrid className="w-3.5 h-3.5 text-blue-500" /> Correlated Network Endpoints
                            </p>
                        </div>

                        <div className="flex items-center bg-black/60 border border-white/10 rounded-2xl px-5 py-3 focus-within:border-blue-500/50 transition-all w-full md:w-96 group shadow-inner">
                            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by IP, MAC, User..."
                                className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-200 ml-4 w-full placeholder:text-slate-600 focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar min-h-[500px]">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <th className="px-6 pb-2 italic">Endpoint Identity</th>
                                    <th className="px-6 pb-2 italic text-center">Risk Score</th>
                                    <th className="px-6 pb-2 italic">OS Distribution</th>
                                    <th className="px-6 pb-2 italic">MAC Identifier</th>
                                    <th className="px-6 pb-2 italic">Last Activity</th>
                                    <th className="px-6 pb-2 italic text-right">Security Posture</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-0">
                                {paginatedAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-slate-600 font-black uppercase tracking-[0.4em] italic opacity-40">
                                            No Asset Correlation Found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAssets.map((asset, i) => (
                                        <tr key={i} className="group bg-white/[0.02] hover:bg-white/[0.05] transition-all transform hover:scale-[1.005]">
                                            <td className="py-5 px-6 first:rounded-l-2xl border-l border-t border-b border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${asset.riskLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                        asset.riskLevel === 'HIGH' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                            'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                        }`}>
                                                        {asset.os?.includes('Windows') ? <Monitor className="w-5 h-5" /> :
                                                            asset.os?.includes('iOS') || asset.os?.includes('Android') ? <Smartphone className="w-5 h-5" /> :
                                                                <Cpu className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white italic">{asset.ip}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <User className="w-2.5 h-2.5 text-slate-500" />
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{asset.user || 'unidentified host'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center border-t border-b border-white/5">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-lg font-black italic ${asset.riskScore > 100 ? 'text-red-400' :
                                                        asset.riskScore > 50 ? 'text-amber-400' :
                                                            'text-emerald-400'
                                                        }`}>
                                                        {asset.riskScore}
                                                    </span>
                                                    <div className="w-12 bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className={`h-full ${asset.riskScore > 100 ? 'bg-red-500' : asset.riskScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${Math.min(100, asset.riskScore / 2)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 border-t border-b border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-white/5 rounded border border-white/10">
                                                        {asset.os?.includes('Windows') ? <Monitor className="w-3 h-3 text-blue-400" /> :
                                                            asset.os?.includes('Linux') ? <Cpu className="w-3 h-3 text-orange-400" /> :
                                                                <Globe className="w-3 h-3 text-slate-500" />}
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{asset.os || 'UNKNOWN OS'}</p>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 border-t border-b border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Fingerprint className="w-3.5 h-3.5 text-slate-600" />
                                                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{asset.mac || 'no-mac-bound'}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 border-t border-b border-white/5 text-xs font-mono font-bold text-slate-400 italic">
                                                {new Date(asset.lastSeen).toLocaleTimeString()}
                                            </td>
                                            <td className="py-5 px-6 last:rounded-r-2xl text-right border-r border-t border-b border-white/5">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${asset.riskLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                                                    asset.riskLevel === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                    }`}>
                                                    {asset.riskLevel}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Showing <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-white">{Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> of <span className="text-white">{filteredAssets.length}</span> Assets
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border ${currentPage === pageNum
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                                                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Next Intelligence
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
