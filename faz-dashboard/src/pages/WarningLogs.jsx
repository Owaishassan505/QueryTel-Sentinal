import React, { useState, useEffect } from "react";
import { apiFetch } from "../api/api";
import LogTable from "../components/Logs/LogTable";
import { Search, RotateCw, AlertTriangle, FileText, Filter, Calendar, Printer } from "lucide-react";

export default function WarningLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [category, setCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const loadLogs = async () => {
        setLoading(true);
        try {
            let url = "/api/logs/warning";
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (category !== "all") params.append("category", category);

            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            const { ok, data } = await apiFetch(url);
            if (ok && Array.isArray(data)) {
                setLogs(data);
            } else {
                setLogs([]);
            }
        } catch (err) {
            console.error("Failed to fetch warning logs", err);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [category, startDate, endDate]);

    const filteredLogs = logs.filter((l) => {
        const s = search.toLowerCase();
        return (
            (l.deviceName || l.devname || "").toLowerCase().includes(s) ||
            (l.sourceIp || l.srcip || "").toLowerCase().includes(s) ||
            (l.destIp || l.dstip || "").toLowerCase().includes(s) ||
            (l.humanMessage || l.message || "").toLowerCase().includes(s) ||
            (l.category || "").toLowerCase().includes(s)
        );
    });

    const exportCSV = () => {
        const header = "Timestamp,Severity,Device,Source,Destination,Message\n";
        const rows = logs.map(log =>
            `${new Date(log.ts || log.timestamp).toLocaleString()},${log.severity},${log.deviceName || log.devname || "-"},${log.sourceIp || log.srcip || "-"},${log.destIp || log.dstip || "-"},"${(log.humanMessage || log.message || "-").replace(/"/g, "'")}"`
        );
        const csv = header + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `warning_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportPDF = () => {
        const printWindow = window.open('', '_blank');
        const content = `
            <html>
                <head>
                    <title>SOC Warning Log Report</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: #333; }
                        h1 { color: #e67e22; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f8f9fa; font-weight: bold; }
                        .footer { margin-top: 30px; font-size: 10px; color: #888; text-align: center; }
                    </style>
                </head>
                <body>
                    <h1>QueryTel SOC Warning Log Report</h1>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                    <p>Range: ${startDate || 'All Time'} to ${endDate || 'Now'}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Device</th>
                                <th>Source IP</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(log => `
                                <tr>
                                    <td>${new Date(log.ts || log.timestamp).toLocaleString()}</td>
                                    <td>${log.deviceName || log.devname || '-'}</td>
                                    <td>${log.sourceIp || log.srcip || '-'}</td>
                                    <td>${log.humanMessage || log.message || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">Confidential - QueryTel Security Operations Center</div>
                </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 italic uppercase">
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                        Warning Logs
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cautionary Network Events</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={exportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all text-xs font-bold shadow-lg"
                    >
                        <Printer className="w-4 h-4" />
                        PDF Report
                    </button>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                    >
                        <FileText className="w-4 h-4" />
                        Excel Report
                    </button>
                    <button
                        className="p-2 bg-[#0f172a] border border-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors shadow-xl"
                        onClick={loadLogs}
                        title="Refresh Logs"
                    >
                        <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-[#0f172a]/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2 text-slate-500">
                    <Filter className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Reports & Filters</span>
                </div>

                <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <input
                            type="date"
                            className="bg-black/20 border border-slate-800 text-[10px] font-bold text-slate-300 px-2 py-1.5 rounded-lg outline-none focus:border-blue-500/50"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <span className="text-slate-600 text-[10px] font-bold">TO</span>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <input
                            type="date"
                            className="bg-black/20 border border-slate-800 text-[10px] font-bold text-slate-300 px-2 py-1.5 rounded-lg outline-none focus:border-blue-500/50"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <select
                    className="bg-black/20 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-blue-500/50 cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="all" className="bg-[#0f172a] text-white">All Categories</option>
                    <option value="SSL" className="bg-[#0f172a] text-white">SSL</option>
                    <option value="VPN" className="bg-[#0f172a] text-white">VPN</option>
                    <option value="IPS" className="bg-[#0f172a] text-white">IPS</option>
                    <option value="Web Filter" className="bg-[#0f172a] text-white">Web Filter</option>
                    <option value="Application Control" className="bg-[#0f172a] text-white">Application Control</option>
                    <option value="Failed Login" className="bg-[#0f172a] text-white">Failed Login</option>
                    <option value="DNS" className="bg-[#0f172a] text-white">DNS</option>
                    <option value="Critical" className="bg-[#0f172a] text-red-400">🔴 Critical</option>
                </select>

                <div className="relative group flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Live filter results..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-black/20 text-slate-300 placeholder:text-slate-600 focus:border-blue-500/50 outline-none transition-all text-xs font-semibold shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-[2rem] border border-slate-800 overflow-hidden min-h-[600px] shadow-2xl">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[600px] text-slate-400">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-xs font-black uppercase tracking-widest">Querying Network Warnings...</p>
                    </div>
                ) : (
                    <LogTable logs={filteredLogs} />
                )}
            </div>
        </div>
    );
}

