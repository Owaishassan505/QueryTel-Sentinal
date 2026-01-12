// src/components/tables/LogTableZ.jsx
import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import LogExpandCard from "./LogExpandCard";

export default function LogTableZ({ logs = [] }) {
    const [expanded, setExpanded] = useState(null);

    function toggleRow(id) {
        setExpanded(expanded === id ? null : id);
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border border-borderColor bg-panel shadow-xl">
            <table className="w-full text-left">
                <thead className="bg-black/10 border-b border-borderColor text-gray-400 text-sm">
                    <tr>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Device</th>
                        <th className="p-3">Source → Destination</th>
                        <th className="p-3">Service</th>
                        <th className="p-3">Time</th>
                        <th className="p-3"></th>
                    </tr>
                </thead>

                <tbody>
                    {logs.map((log, idx) => {
                        const id = log._id || idx;
                        const isOpen = expanded === id;

                        return (
                            <React.Fragment key={id}>
                                {/* Row */}
                                <tr
                                    className="border-b border-borderColor hover:bg-white/5 cursor-pointer transition"
                                    onClick={() => toggleRow(id)}
                                >
                                    <td className="p-3 capitalize font-medium text-primary">{log.severity}</td>
                                    <td className="p-3">{log.deviceName || "Unknown"}</td>
                                    <td className="p-3 text-sm">
                                        {log.sourceIp} → {log.destIp}
                                    </td>
                                    <td className="p-3">{log.service}</td>
                                    <td className="p-3 text-xs text-gray-400">
                                        {new Date(log.ts).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-right">
                                        {isOpen ? (
                                            <ChevronUpIcon className="w-5 h-5 text-primary" />
                                        ) : (
                                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                        )}
                                    </td>
                                </tr>

                                {/* Expandable Row */}
                                {isOpen && (
                                    <tr className="bg-black/20">
                                        <td colSpan="6" className="p-4">
                                            <LogExpandCard log={log} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            {logs.length === 0 && (
                <div className="p-6 text-center text-gray-500">No logs available.</div>
            )}
        </div>
    );
}
