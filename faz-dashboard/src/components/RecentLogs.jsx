import React, { useState } from "react";

export default function RecentLogs({ logs = [] }) {
    const [selectedLog, setSelectedLog] = useState(null);
    const [creatingTicket, setCreatingTicket] = useState(null);
    const [page, setPage] = useState(1);

    const pageSize = 20; // adjust how many logs per page
    const totalPages = Math.ceil(logs.length / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const visibleLogs = logs.slice(start, end);

    const getVal = (obj, keys, fallback = "-") => {
        for (let key of keys) {
            if (obj && obj[key] !== undefined) return obj[key];
        }
        return fallback;
    };

    const createTicket = async (log) => {
        setCreatingTicket(log.fingerprint);
        try {
            const res = await fetch(`/logs/zoho/${log.fingerprint}`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Zoho ticket created! Ticket ID: ${data.ticket?.id || "N/A"}`);
            } else {
                alert("❌ Failed to create Zoho ticket");
            }
        } catch (err) {
            alert("❌ Error creating ticket: " + err.message);
        }
        setCreatingTicket(null);
    };

    return (
        <div className="rounded-2xl bg-gray-800 p-4 shadow-md overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4">
                📜 QueryTel Inc – Recent Logs
            </h2>

            <table className="min-w-full text-sm">
                <thead>
                    <tr className="text-left border-b border-gray-700">
                        <th className="px-2 py-1">Timestamp</th>
                        <th className="px-2 py-1">Severity</th>
                        <th className="px-2 py-1">Source</th>
                        <th className="px-2 py-1">Destination</th>
                        <th className="px-2 py-1">Action</th>
                        <th className="px-2 py-1">AI Summary</th>
                        <th className="px-2 py-1">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {visibleLogs.map((log, i) => {
                        const parsed = log.parsed || {};
                        const severity = (log.event?.severity || "").toLowerCase();
                        return (
                            <tr key={i} className="border-t border-gray-700">
                                <td className="px-2 py-1">{log.timestamp || log.ts || "-"}</td>
                                <td
                                    className={`px-2 py-1 font-semibold ${severity === "error"
                                            ? "text-red-500"
                                            : severity === "warn"
                                                ? "text-yellow-500"
                                                : "text-green-500"
                                        }`}
                                >
                                    {log.event?.severity || parsed.level || "-"}
                                </td>
                                <td className="px-2 py-1">
                                    {getVal(parsed, ["srcip", "source"])}
                                </td>
                                <td className="px-2 py-1">
                                    {getVal(parsed, ["dstip", "destination"])}
                                </td>
                                <td className="px-2 py-1">{getVal(parsed, ["action"])}</td>
                                <td className="px-2 py-1 text-blue-300">
                                    {log.event?.summary || "⏳ Pending…"}
                                </td>
                                <td className="px-2 py-1 space-x-2">
                                    <button
                                        onClick={() => setSelectedLog(log)}
                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-xs"
                                    >
                                        📄 View
                                    </button>
                                    <button
                                        onClick={() => createTicket(log)}
                                        disabled={creatingTicket === log.fingerprint}
                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs disabled:opacity-50"
                                    >
                                        {creatingTicket === log.fingerprint
                                            ? "⏳ Creating…"
                                            : "🎫 Zoho"}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4 text-sm text-gray-300">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
                >
                    ◀ Prev
                </button>
                <span>
                    Page {page} of {totalPages || 1}
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
                >
                    Next ▶
                </button>
            </div>

            {/* Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-xl w-3/4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-4">Log Details</h2>
                        <table className="min-w-full text-sm">
                            <tbody>
                                {Object.entries({
                                    ...selectedLog.event,
                                    ...selectedLog.parsed,
                                    ts: selectedLog.ts,
                                    raw: selectedLog.raw,
                                }).map(([key, val]) => (
                                    <tr key={key} className="border-t border-gray-700">
                                        <td className="px-2 py-1 font-semibold text-gray-400">
                                            {key}
                                        </td>
                                        <td className="px-2 py-1">{String(val)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-4 text-right">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}