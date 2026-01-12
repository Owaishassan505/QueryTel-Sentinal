import React from "react";

export default function LogDrawer({ open, onClose, logs, category }) {
    return (
        <div
            className={`fixed top-0 right-0 h-full w-[420px] bg-panel border-l border-borderColor shadow-xl transform transition-transform duration-300 z-50 ${open ? "translate-x-0" : "translate-x-full"
                }`}
        >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-borderColor">
                <h2 className="text-lg font-semibold">{category} Logs</h2>
                <button
                    className="text-red-400 hover:text-red-500"
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>

            {/* Logs */}
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
                {logs.length === 0 && (
                    <p className="text-gray-400 text-sm">No logs found.</p>
                )}

                {logs.map((log, i) => (
                    <div
                        key={i}
                        className="p-3 mb-2 bg-[#111827] border border-gray-700 rounded-md"
                    >
                        <div className="text-sm font-semibold text-primary">
                            {log.severity?.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-300">
                            {log.message || log.description}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                            {log.timestamp}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
