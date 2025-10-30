import React, { useState, useMemo } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


export default function LogsTable({ logs = [] }) {
    const logsPerPage = 18;
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const backendURL = "http://10.106.87.146:3320";

    const totalPages = Math.ceil(logs.length / logsPerPage);

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (!fromDate && !toDate) return true;
            const logDate = new Date(log.ts || log.time);
            const from = fromDate ? new Date(fromDate) : null;
            const to = toDate ? new Date(toDate) : null;
            return (!from || logDate >= from) && (!to || logDate <= to);
        });
    }, [logs, fromDate, toDate]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * logsPerPage;
        return filteredLogs.slice(start, start + logsPerPage);
    }, [filteredLogs, currentPage]);

    // CSV Export
    const exportCSV = () => {
        const csvContent =
            "data:text/csv;charset=utf-8," +
            [
                ["Timestamp", "Severity", "Source", "Destination", "Action", "Message"],
                ...filteredLogs.map((log) => [
                    new Date(log.ts || log.time).toLocaleString(),
                    log.severity || "-",
                    log.parsed?.srcip || "-",
                    log.parsed?.dstip || "-",
                    log.parsed?.action || "-",
                    log.message?.replace(/,/g, ";") || "-",
                ]),
            ]
                .map((e) => e.join(","))
                .join("\n");

        const blob = new Blob([decodeURIComponent(encodeURI(csvContent))], {
            type: "text/csv;charset=utf-8;",
        });
        saveAs(blob, `QueryTel_Logs_${fromDate || "all"}_to_${toDate || "all"}.csv`);
    };

    // PDF Export
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("QueryTel SOC Logs Report", 14, 16);
        doc.setFontSize(10);
        doc.text(`Date Range: ${fromDate || "All"} - ${toDate || "All"}`, 14, 24);

        const tableData = filteredLogs.map((log) => [
            new Date(log.ts || log.time).toLocaleString(),
            log.severity || "-",
            log.parsed?.srcip || "-",
            log.parsed?.dstip || "-",
            log.parsed?.action || "-",
            log.message?.slice(0, 60) || "-",
        ]);

        doc.autoTable({
            head: [["Timestamp", "Severity", "Source", "Destination", "Action", "Message"]],
            body: tableData,
            startY: 30,
            styles: { fontSize: 8 },
        });

        doc.save(`QueryTel_Logs_${fromDate || "all"}_to_${toDate || "all"}.pdf`);
    };

    if (!logs.length) return <p className="text-gray-400 text-sm">No logs available.</p>;

    // Utility: Convert raw log message into a readable summary
    const formatReadableMessage = (log) => {
        const msg = log.message || "";
        const parsed = log.parsed || {};

        const src = parsed.srcip || "Unknown Source";
        const dst = parsed.dstip || "Unknown Destination";
        const act = parsed.action || "unknown action";
        const app = parsed.app || parsed.service || parsed.qname || "unspecified service";
        const proto = parsed.proto || "unknown protocol";
        const severity = log.severity || "info";
        const policy = log.policytype || parsed.policytype || "policy";

        // Intelligent classification
        if (msg.includes("block") || act === "blocked")
            return `🚫 Blocked ${app} traffic from ${src} to ${dst} (${policy}, severity: ${severity})`;

        if (msg.includes("pass") || act === "pass")
            return `✅ Allowed ${app} connection from ${src} to ${dst} using ${proto.toUpperCase()}`;

        if (msg.includes("dropped") || act === "dropped")
            return `⚠️ Dropped packet from ${src} to ${dst} (${app})`;

        if (msg.includes("tunnel") || app.toLowerCase().includes("vpn"))
            return `🔐 VPN traffic detected from ${src} to ${dst}`;

        if (msg.includes("dns") || app.toLowerCase().includes("dns"))
            return `🌐 DNS query from ${src} to ${dst} (${app})`;

        // Fallback
        return `ℹ️ ${severity.toUpperCase()} event: ${app} (${act}) from ${src} → ${dst}`;
    };


    return (
        <div>
            {/* Filter + Export Bar */}
            <div className="flex flex-wrap justify-between items-center mb-4 bg-gray-800/40 p-3 rounded-lg border border-gray-700 shadow-md">
                <div className="flex items-center gap-3 flex-wrap">
                    <div>
                        <label className="text-gray-300 text-sm mr-2">From:</label>
                        <DatePicker
                            selected={fromDate ? new Date(fromDate) : null}
                            onChange={(date) => setFromDate(date?.toISOString().split("T")[0] || "")}
                            dateFormat="yyyy-MM-dd"
                            className="bg-gray-900 text-gray-200 rounded px-2 py-1 text-sm border border-gray-700 focus:ring-1 focus:ring-blue-500"
                            placeholderText="Select date"
                        />

                    </div>
                    <div>
                        <label className="text-gray-300 text-sm mr-2">To:</label>
                        <DatePicker
                            selected={toDate ? new Date(toDate) : null}
                            onChange={(date) => setToDate(date?.toISOString().split("T")[0] || "")}
                            dateFormat="yyyy-MM-dd"
                            className="bg-gray-900 text-gray-200 rounded px-2 py-1 text-sm border border-gray-700 focus:ring-1 focus:ring-blue-500"
                            placeholderText="Select date"
                        />

                    </div>
                    <button
                        onClick={() => {
                            setFromDate("");
                            setToDate("");
                        }}
                        className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs text-gray-200"
                    >
                        Clear
                    </button>
                </div>

                <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs rounded shadow-md"
                    >
                        📄 Export CSV
                    </button>
                    <button
                        onClick={exportPDF}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs rounded shadow-md"
                    >
                        🧾 Export PDF
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-inner">
                <table className="min-w-full text-sm text-gray-300">
                    <thead className="bg-gray-800 text-xs uppercase text-gray-400">
                        <tr>
                            <th className="p-2 text-left">Timestamp</th>
                            <th className="p-2 text-left">Severity</th>
                            <th className="p-2 text-left">Source</th>
                            <th className="p-2 text-left">Destination</th>
                            <th className="p-2 text-left">Action</th>
                            <th className="p-2 text-left">Message</th>
                            <th className="p-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((log, i) => {
                            const sev = (log.severity || log.event?.severity || "info").toLowerCase();
                            const color =
                                sev === "error"
                                    ? "text-red-400"
                                    : sev === "warning" || sev === "warn"
                                        ? "text-yellow-400"
                                        : "text-green-400";
                            const ts = new Date(log.ts || log.time).toLocaleString();

                            return (
                                <tr
                                    key={i}
                                    className="border-b border-gray-700 hover:bg-gray-800/40 transition"
                                >
                                    <td className="p-2">{ts}</td>
                                    <td className={`p-2 font-semibold ${color}`}>
                                        {sev.toUpperCase()}
                                    </td>
                                    <td className="p-2">{log.parsed?.srcip || "-"}</td>
                                    <td className="p-2">{log.parsed?.dstip || "-"}</td>
                                    <td className="p-2">{log.parsed?.action || "-"}</td>
                                    <td className="p-2 truncate max-w-[320px]" title={log.message}>
                                        {formatReadableMessage(log)}
                                    </td>

                                    <td className="p-2 flex gap-2">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-xs rounded text-white"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => {
                                                fetch(`${backendURL}/api/zoho/tickets`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        userName: "SOC Analyst",
                                                        userEmail: "noreply@querytel.com",
                                                        issueDescription: log.message || "SOC Alert",
                                                    }),
                                                });
                                            }}
                                            className="bg-green-600 hover:bg-green-700 px-3 py-1 text-xs rounded text-white"
                                        >
                                            Zoho
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm text-gray-300">
                <span>
                    Showing {Math.min(logsPerPage * currentPage, filteredLogs.length)} of{" "}
                    {filteredLogs.length}
                </span>
                <div className="flex gap-3">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-600"
                    >
                        ⬅ Prev
                    </button>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-600"
                    >
                        Next ➡
                    </button>
                </div>
            </div>

            {/* Modal */}
            {/* Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div
                        className={`bg-slate-900 text-gray-100 rounded-2xl shadow-lg w-[95%] max-w-6xl p-6 relative max-h-[90vh] overflow-y-auto border border-slate-700 ${selectedLog.severity?.toLowerCase() === "error"
                            ? "glow-red"
                            : selectedLog.severity?.toLowerCase().includes("warn")
                                ? "glow-yellow"
                                : "glow-blue"
                            }`}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedLog(null)}
                            className="absolute top-3 right-3 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                        >
                            ✖ Close
                        </button>

                        {/* Header */}
                        <h2 className="text-2xl font-semibold mb-6 text-blue-400">
                            Log Details — {selectedLog.devname || "Unknown Device"}
                        </h2>

                        {/* Grid Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed">

                            {/* 🛡️ Security */}
                            <div className="space-y-2">
                                <h3 className="text-orange-400 font-semibold mb-1">🛡️ Security</h3>
                                <p><b>Level:</b> {selectedLog.severity || "N/A"}</p>
                                <p><b>Threat Level:</b> {selectedLog.threat_level || selectedLog.parsed?.threat_level || "N/A"}</p>
                                <p><b>Threat Score:</b> {selectedLog.threat_score || selectedLog.parsed?.threat_score || "N/A"}</p>
                                <p><b>Policy Type:</b> {selectedLog.policytype || selectedLog.parsed?.policytype || "-"}</p>
                                <p><b>Profile:</b> {selectedLog.profile || selectedLog.parsed?.profile || "-"}</p>
                            </div>

                            {/* 📋 General */}
                            <div className="space-y-2">
                                <h3 className="text-green-400 font-semibold mb-1">📋 General</h3>
                                <p><b>Log ID:</b> {selectedLog.logid || "N/A"}</p>
                                <p>
                                    <b>Message:</b>{" "}
                                    <span className="text-gray-100">{formatReadableMessage(selectedLog)}</span>
                                </p>
                                <p className="text-gray-500 text-xs mt-1 break-all">
                                    {selectedLog.message}
                                </p>


                                <p><b>Session ID:</b> {selectedLog.sessionid || selectedLog.parsed?.sessionid || "-"}</p>
                                <p><b>Virtual Domain:</b> {selectedLog.vd || selectedLog.vdom || "root"}</p>
                                <p><b>Direction:</b> {selectedLog.direction || selectedLog.parsed?.dir || "-"}</p>
                                <p><b>Event Time:</b> {selectedLog.eventtime || "-"}</p>
                                <p><b>Transaction ID (xid):</b> {selectedLog.xid || "-"}</p>
                            </div>

                            {/* 📡 Source */}
                            <div className="space-y-2">
                                <h3 className="text-blue-400 font-semibold mb-1">📡 Source</h3>
                                <p><b>Device ID:</b> {selectedLog.devid || "-"}</p>
                                <p><b>Device Name:</b> {selectedLog.devname || "-"}</p>
                                <p><b>Source IP:</b> {selectedLog.parsed?.srcip || "-"}</p>
                                <p><b>Interface:</b> {selectedLog.parsed?.srcintf || "-"}</p>
                                <p><b>Interface Role:</b> {selectedLog.parsed?.srcintfrole || "-"}</p>
                                <p><b>Source Port:</b> {selectedLog.parsed?.srcport || "-"}</p>
                                <p><b>Source Country:</b> {selectedLog.parsed?.srccountry || "Reserved"}</p>
                                <p><b>UEBA Endpoint ID:</b> {selectedLog.parsed?.ueba_endpoint_id || "-"}</p>
                                <p><b>UEBA User ID:</b> {selectedLog.parsed?.ueba_user_id || "-"}</p>
                            </div>

                            {/* 🎯 Destination */}
                            <div className="space-y-2">
                                <h3 className="text-yellow-400 font-semibold mb-1">🎯 Destination</h3>
                                <p><b>Host Name:</b> {selectedLog.parsed?.hostname || selectedLog.qname || "-"}</p>
                                <p><b>Destination IP:</b> {selectedLog.parsed?.dstip || "-"}</p>
                                <p><b>Interface:</b> {selectedLog.parsed?.dstintf || "-"}</p>
                                <p><b>Interface Role:</b> {selectedLog.parsed?.dstintfrole || "-"}</p>
                                <p><b>Destination Port:</b> {selectedLog.parsed?.dstport || "-"}</p>
                                <p><b>Destination Country:</b> {selectedLog.parsed?.dstcountry || "-"}</p>
                                <p><b>Destination Endpoint ID:</b> {selectedLog.parsed?.dst_endpoint_id || "-"}</p>
                                <p><b>Destination End User ID:</b> {selectedLog.parsed?.dst_end_user_id || "-"}</p>
                            </div>

                            {/* ⚙️ Action */}
                            <div className="space-y-2">
                                <h3 className="text-rose-400 font-semibold mb-1">⚙️ Action</h3>
                                <p><b>Action:</b> {selectedLog.parsed?.action || "-"}</p>
                                <p><b>Policy ID:</b> {selectedLog.policyid || "-"}</p>
                                <p><b>Policy UUID:</b> {selectedLog.policyuuid || "-"}</p>
                                <p><b>Policy Type:</b> {selectedLog.policytype || "-"}</p>
                                <p><b>Threat:</b> {selectedLog.threat || "-"}</p>
                            </div>

                            {/* 🧩 Application */}
                            <div className="space-y-2">
                                <h3 className="text-indigo-400 font-semibold mb-1">🧩 Application</h3>
                                <p><b>Application:</b> {selectedLog.app || selectedLog.parsed?.app || "-"}</p>
                                <p><b>Application Category:</b> {selectedLog.appcat || selectedLog.categorydesc || "-"}</p>
                                <p><b>Application ID:</b> {selectedLog.appid || selectedLog.parsed?.appid || "-"}</p>
                                <p><b>Protocol:</b> {selectedLog.proto || selectedLog.parsed?.proto || "-"}</p>
                                <p><b>Service:</b> {selectedLog.service || selectedLog.parsed?.service || "-"}</p>
                                <p><b>URL:</b> {selectedLog.url || selectedLog.parsed?.url || "-"}</p>
                                <p><b>Query Name (qname):</b> {selectedLog.qname || "-"}</p>
                                <p><b>Query Type:</b> {selectedLog.qtype || "-"}</p>
                                <p><b>Query Type Value:</b> {selectedLog.qtypeval || "-"}</p>
                                <p><b>Query Class:</b> {selectedLog.qclass || "-"}</p>
                            </div>

                            {/* 🚨 Threat */}
                            <div className="space-y-2">
                                <h3 className="text-red-400 font-semibold mb-1">🚨 Threat</h3>
                                <p><b>Attack Name:</b> {selectedLog.attack_name || selectedLog.parsed?.attack || "-"}</p>
                                <p><b>Attack ID:</b> {selectedLog.attack_id || "-"}</p>
                                <p><b>Incident Serial No.:</b> {selectedLog.incident_serial || "-"}</p>
                                <p><b>Reference:</b>{" "}
                                    {selectedLog.reference ? (
                                        <a href={selectedLog.reference} target="_blank" rel="noreferrer" className="text-blue-400 underline">
                                            {selectedLog.reference}
                                        </a>
                                    ) : "-"}
                                </p>
                            </div>

                            {/* 💾 Data */}
                            <div className="space-y-2">
                                <h3 className="text-teal-400 font-semibold mb-1">💾 Data</h3>
                                <p><b>Archive:</b> {selectedLog.archive || "-"}</p>
                                <p><b>Received:</b> {selectedLog.data_received || "-"}</p>
                                <p><b>Sent:</b> {selectedLog.data_sent || "-"}</p>
                            </div>

                            {/* 📘 Type */}
                            <div className="space-y-2">
                                <h3 className="text-cyan-400 font-semibold mb-1">📘 Type</h3>
                                <p><b>Event Type:</b> {selectedLog.parsed?.eventtype || selectedLog.eventtype || "-"}</p>
                                <p><b>Subtype:</b> {selectedLog.parsed?.subtype || selectedLog.subtype || "-"}</p>
                                <p><b>Type:</b> {selectedLog.parsed?.type || selectedLog.type || "-"}</p>
                                <p><b>Category Description:</b> {selectedLog.categorydesc || "-"}</p>
                            </div>

                            {/* 📂 Others */}
                            <div className="space-y-2">
                                <h3 className="text-gray-300 font-semibold mb-1">📂 Others</h3>
                                <p><b>CVE ID:</b> {selectedLog.cve || "-"}</p>
                                <p><b>Date/Time:</b> {new Date(selectedLog.time || selectedLog.ts).toLocaleString()}</p>
                                <p><b>Device Time:</b> {selectedLog.devtime || "-"}</p>
                                <p><b>Time Zone:</b> {selectedLog.tz || "-"}</p>
                                <p><b>Log Version:</b> {selectedLog.logver || "-"}</p>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="text-xs text-gray-500 text-center mt-6">
                            Powered by{" "}
                            <a
                                href="https://querytel.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-500 font-medium"
                            >
                                QueryTel Inc.
                            </a>
                        </div>
                    </div>

                </div>
            )
            };

        </div>
    );
}