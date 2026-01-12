// src/components/tables/LogExpandCard.jsx
import React, { useState } from "react";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export default function LogExpandCard({ log }) {
    const [tab, setTab] = useState("summary");

    return (
        <div className="border border-borderColor rounded-xl bg-panel/80 p-5 shadow-md backdrop-blur">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-borderColor pb-2 mb-4">
                <button
                    className={`pb-1 ${tab === "summary"
                            ? "text-primary border-b-2 border-primary"
                            : "text-gray-400"
                        }`}
                    onClick={() => setTab("summary")}
                >
                    Summary View
                </button>

                <button
                    className={`pb-1 ${tab === "raw"
                            ? "text-primary border-b-2 border-primary"
                            : "text-gray-400"
                        }`}
                    onClick={() => setTab("raw")}
                >
                    Raw JSON
                </button>
            </div>

            {/* Summary View */}
            {tab === "summary" && (
                <div className="grid grid-cols-2 gap-4">
                    <CardRow label="Device" value={log.deviceName} />
                    <CardRow label="Severity" value={log.severity} />
                    <CardRow label="Action" value={log.action} />
                    <CardRow label="Policy ID" value={log.policyId} />
                    <CardRow label="Source IP" value={log.sourceIp} />
                    <CardRow label="Destination IP" value={log.destIp} />
                    <CardRow label="Source Port" value={log.srcPort} />
                    <CardRow label="Destination Port" value={log.dstPort} />
                    <CardRow label="Service" value={log.service} />
                    <CardRow
                        label="Event Time"
                        value={new Date(log.ts).toLocaleString()}
                    />

                    <div className="col-span-2 mt-4">
                        <button className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
                            <ClipboardDocumentListIcon className="w-5" /> Create Zoho Ticket
                        </button>
                    </div>
                </div>
            )}

            {/* Raw JSON */}
            {tab === "raw" && (
                <pre className="bg-black/30 p-4 rounded-lg text-green-400 text-xs overflow-auto">
                    {JSON.stringify(log, null, 2)}
                </pre>
            )}
        </div>
    );
}

function CardRow({ label, value }) {
    return (
        <div className="p-3 rounded-lg bg-black/10 border border-borderColor">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-medium">{value || "—"}</p>
        </div>
    );
}
