import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LogModal({ log, onClose }) {
    if (!log) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="overlay"
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    key="modal"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="bg-[#111827] text-gray-100 rounded-2xl shadow-2xl w-[80vw] max-w-5xl max-h-[85vh] overflow-y-auto border border-slate-700"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-slate-700 px-6 py-4 sticky top-0 bg-[#111827]/80 backdrop-blur-md rounded-t-2xl">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-100">
                            📘 Log Details
                        </h2>
                        <button
                            onClick={onClose}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm"
                        >
                            ✖ Close
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 text-sm leading-relaxed">
                        {/* Event Section */}
                        <section>
                            <h3 className="text-lg font-semibold text-blue-400 mb-2">
                                🧠 Event
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <p><b>Severity:</b> {log.event?.severity || "N/A"}</p>
                                <p><b>Message:</b> {log.event?.message || "N/A"}</p>
                                <p><b>Summary:</b> {log.event?.summary || "⏳ Pending…"}</p>
                            </div>
                        </section>

                        {/* Parsed Fields */}
                        <section>
                            <h3 className="text-lg font-semibold text-green-400 mb-2">
                                🧩 Parsed Fields
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <p><b>Device:</b> {log.parsed?.devname || "N/A"}</p>
                                <p><b>Device ID:</b> {log.parsed?.devid || "N/A"}</p>
                                <p><b>Date:</b> {log.parsed?.date || "N/A"} {log.parsed?.time || ""}</p>
                                <p><b>Timezone:</b> {log.parsed?.tz || "N/A"}</p>
                                <p><b>Source IP:</b> {log.parsed?.srcip || "N/A"}</p>
                                <p><b>Source Interface:</b> {log.parsed?.srcintf || "N/A"}</p>
                                <p><b>Destination IP:</b> {log.parsed?.dstip || "N/A"}</p>
                                <p><b>Destination Interface:</b> {log.parsed?.dstintf || "N/A"}</p>
                                <p><b>Source Country:</b> {log.parsed?.srccountry || "N/A"}</p>
                                <p><b>Destination Country:</b> {log.parsed?.dstcountry || "N/A"}</p>
                                <p><b>Action:</b> {log.parsed?.action || "N/A"}</p>
                                <p><b>Service:</b> {log.parsed?.service || "N/A"}</p>
                                <p><b>Application:</b> {log.parsed?.app || "N/A"}</p>
                                <p><b>Protocol:</b> {log.parsed?.proto || "N/A"}</p>
                                <p><b>Duration:</b> {log.parsed?.duration || "N/A"}s</p>
                                <p><b>Sent Bytes:</b> {log.parsed?.sentbyte || "0"}</p>
                                <p><b>Received Bytes:</b> {log.parsed?.rcvdbyte || "0"}</p>
                                <p><b>Sent Packets:</b> {log.parsed?.sentpkt || "0"}</p>
                                <p><b>Received Packets:</b> {log.parsed?.rcvdpkt || "0"}</p>
                            </div>
                        </section>

                        {/* Metadata */}
                        <section>
                            <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                                🗂 Metadata
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <p><b>Timestamp:</b> {log.ts || "N/A"}</p>
                                <p><b>Log Version:</b> {log.parsed?.logver || "N/A"}</p>
                                <p><b>Log ID:</b> {log.parsed?.logid || "N/A"}</p>
                                <p><b>Event Time:</b> {log.parsed?.eventtime || "N/A"}</p>
                                <p><b>Policy ID:</b> {log.parsed?.policyid || "N/A"}</p>
                                <p><b>Policy Type:</b> {log.parsed?.policytype || "N/A"}</p>
                                <p><b>Session ID:</b> {log.parsed?.sessionid || "N/A"}</p>
                            </div>
                        </section>

                        {/* Raw Log */}
                        <section>
                            <h3 className="text-lg font-semibold text-red-400 mb-2">🧾 Raw Log</h3>
                            <pre className="bg-slate-800/70 border border-slate-700 p-3 rounded-lg text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
                                {log.raw || "No raw log data available."}
                            </pre>
                        </section>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
