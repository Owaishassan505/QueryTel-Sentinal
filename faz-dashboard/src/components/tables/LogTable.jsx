// src/components/tables/LogTable.jsx
import React, { useState, useMemo } from "react";
import SeverityBadge from "../shared/SeverityBadge";

export default function LogTable({ logs = [] }) {
    const [page, setPage] = useState(1);
    const [modalLog, setModalLog] = useState(null);

    const PAGE_SIZE = 15;

    const totalPages = Math.ceil(logs.length / PAGE_SIZE);

    const pageLogs = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return logs.slice(start, start + PAGE_SIZE);
    }, [page, logs]);

    const format = (val) => val || "-";

    const openModal = (log) => setModalLog(log);
    const closeModal = () => setModalLog(null);

    return (
        <div className="bg-card rounded-xl border border-borderColor shadow-xl p-4">

            {/* HEADER */}
            <div className="flex justify-between items-center pb-4">
                <h2 className="text-lg font-bold text-primary">Log Explorer</h2>
                <span className="text-gray-400 text-sm">
                    Showing page {page} of {totalPages}
                </span>
            </div>

            {/* TABLE */}
            <div className="overflow-auto rounded-lg border border-borderColor">
                <table className="min-w-full text-sm">
                    <thead className="bg-panel text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-3 py-2">Timestamp</th>
                            <th className="px-3 py-2">Severity</th>
                            <th className="px-3 py-2">Device</th>
                            <th className="px-3 py-2">Source</th>
                            <th className="px-3 py-2">Destination</th>
                            <th className="px-3 py-2">Message</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-borderColor">
                        {pageLogs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-primary/5 transition">
                                <td className="px-3 py-2 text-gray-300">
                                    {new Date(log.ts).toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                    <SeverityBadge severity={log.severity} />
                                </td>
                                <td className="px-3 py-2 text-gray-200">
                                    {format(log.deviceName)}
                                </td>
                                <td className="px-3 py-2 text-gray-200">
                                    {format(log.sourceIp)}
                                </td>
                                <td className="px-3 py-2 text-gray-200">
                                    {format(log.destIp)}
                                </td>
                                <td className="px-3 py-2 text-gray-200 truncate max-w-xs">
                                    {format(log.cleanMessage || log.humanMessage || log.message)}
                                </td>



                                {/* ACTIONS */}
                                <td className="px-3 py-2 text-right">
                                    <button
                                        className="px-3 py-1 bg-blue-600 text-white rounded-md mr-2"
                                        onClick={() => openModal(log)}
                                    >
                                        View
                                    </button>

                                    <button
                                        className="px-3 py-1 bg-green-600 text-white rounded-md"
                                        onClick={() =>
                                            window.dispatchEvent(
                                                new CustomEvent("CREATE_ZOHO_TICKET", {
                                                    detail: log,
                                                })
                                            )
                                        }
                                    >
                                        Zoho
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {pageLogs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500">
                                    No logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-4">
                <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className={`px-4 py-2 rounded-lg border border-borderColor ${page <= 1 ? "opacity-40" : ""
                        }`}
                >
                    ⬅ Previous
                </button>

                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className={`px-4 py-2 rounded-lg border border-borderColor ${page >= totalPages ? "opacity-40" : ""
                        }`}
                >
                    Next ➡
                </button>
            </div>

            {/* POWERED BY */}
            <div className="text-center text-xs text-gray-500 mt-4">
                Powered by <span className="text-primary">QueryTel Inc.</span>
            </div>

            {/* =======================================================
                FULLSCREEN MODAL (BIG STRUCTURED DETAILS LIKE OLD SOC)
                ======================================================= */}
            {modalLog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-card w-full max-w-6xl max-h-[95vh] overflow-auto rounded-xl border border-borderColor shadow-2xl p-6 relative">

                        {/* CLOSE BUTTON */}
                        <button
                            className="absolute top-3 right-3 px-4 py-1 bg-red-600 text-white rounded-md"
                            onClick={closeModal}
                        >
                            ✕ Close
                        </button>

                        {/* === MODAL TITLE === */}
                        <h2 className="text-xl font-bold mb-4 text-primary">
                            Log Details — {modalLog.deviceName || "Unknown Device"}
                        </h2>

                        {/* === GRID LAYOUT WITH SECTIONS === */}
                        <div className="grid grid-cols-3 gap-6 text-sm text-gray-200">

                            {/* SECURITY */}
                            <div>
                                <h3 className="font-bold text-yellow-400 mb-2">🔐 Security</h3>
                                <p><b>Level:</b> {format(modalLog.severity)}</p>
                                <p><b>Threat Level:</b> {modalLog.threatLevel || "N/A"}</p>
                                <p><b>Threat Score:</b> {modalLog.threatScore || "N/A"}</p>
                                <p><b>Policy Type:</b> {format(modalLog.policyType)}</p>
                                <p><b>Profile:</b> {modalLog.profile || "N/A"}</p>
                            </div>

                            {/* GENERAL */}
                            <div>
                                <h3 className="font-bold text-blue-400 mb-2">📘 General</h3>
                                <p><b>Log ID:</b> {modalLog.logId || "N/A"}</p>
                                {/* USER-FRIENDLY MESSAGE */}
                                {/* USER-FRIENDLY MESSAGE (Summary Box) */}
                                {modalLog.cleanMessage && (
                                    <div className="mt-6 bg-black/40 p-4 rounded-lg border border-borderColor">
                                        <h3 className="text-primary font-bold mb-2">Summary</h3>

                                        <p className="text-gray-200 text-sm leading-relaxed">
                                            {modalLog.cleanMessage ||
                                                modalLog.humanMessage ||
                                                modalLog.message ||
                                                "No message"}
                                        </p>
                                    </div>
                                )}



                                <p><b>Session ID:</b> {format(modalLog.sessionId)}</p>
                                <p><b>VDOM:</b> {modalLog.virtualDomain || "root"}</p>
                            </div>

                            {/* SOURCE */}
                            <div>
                                <h3 className="font-bold text-green-400 mb-2">📌 Source</h3>
                                <p><b>Device:</b> {format(modalLog.deviceName)}</p>
                                <p><b>IP:</b> {format(modalLog.sourceIp)}</p>
                                <p><b>Port:</b> {format(modalLog.srcPort)}</p>
                                <p><b>Country:</b> {format(modalLog.srcCountry)}</p>
                            </div>

                            {/* DESTINATION */}
                            <div>
                                <h3 className="font-bold text-pink-400 mb-2">🎯 Destination</h3>
                                <p><b>Host:</b> {format(modalLog.host)}</p>
                                <p><b>IP:</b> {format(modalLog.destIp)}</p>
                                <p><b>Port:</b> {format(modalLog.dstPort)}</p>
                                <p><b>Country:</b> {format(modalLog.destCountry)}</p>
                            </div>

                            {/* ACTION */}
                            <div>
                                <h3 className="font-bold text-red-400 mb-2">⚙ Action</h3>
                                <p><b>Action:</b> {format(modalLog.action)}</p>
                                <p><b>Policy ID:</b> {format(modalLog.policyId)}</p>
                                <p><b>Service:</b> {format(modalLog.service)}</p>
                            </div>

                            {/* APPLICATION */}
                            <div>
                                <h3 className="font-bold text-purple-400 mb-2">💻 Application</h3>
                                <p><b>Application:</b> {format(modalLog.application)}</p>
                                <p><b>Protocol:</b> {format(modalLog.protocol)}</p>
                                <p><b>URL:</b> {format(modalLog.url)}</p>
                            </div>

                            {/* THREAT */}
                            <div>
                                <h3 className="font-bold text-red-500 mb-2">🚨 Threat</h3>
                                <p><b>Name:</b> {format(modalLog.attackName)}</p>
                                <p><b>Attack ID:</b> {format(modalLog.attackId)}</p>
                                <p><b>Incident No:</b> {format(modalLog.incidentSerial)}</p>
                            </div>

                            {/* TYPE */}
                            <div>
                                <h3 className="font-bold text-blue-500 mb-2">📦 Type</h3>
                                <p><b>Event Type:</b> {format(modalLog.eventType)}</p>
                                <p><b>Subtype:</b> {format(modalLog.subtype)}</p>
                                <p><b>Category:</b> {format(modalLog.category)}</p>
                            </div>

                            {/* DATA */}
                            <div>
                                <h3 className="font-bold text-green-500 mb-2">📤 Data</h3>
                                <p><b>Received:</b> {format(modalLog.received)}</p>
                                <p><b>Sent:</b> {format(modalLog.sent)}</p>
                            </div>

                            {/* OTHERS */}
                            <div>
                                <h3 className="font-bold text-gray-300 mb-2">📁 Others</h3>
                                <p><b>CVE ID:</b> {format(modalLog.cve)}</p>
                                <p><b>Device Time:</b> {format(modalLog.deviceTime)}</p>
                                <p><b>Time Zone:</b> {format(modalLog.timeZone)}</p>
                            </div>

                        </div>



                        {/* FOOTER */}
                        <div className="text-center text-gray-400 text-xs mt-6">
                            Powered by <span className="text-primary font-semibold">QueryTel Inc.</span>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
