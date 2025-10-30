import React from "react";

export default function LogsLayout({
    title,
    color = "text-blue-400",
    children,
    paused,
    setPaused,
    search,
    setSearch,
}) {
    return (
        <div className="p-6 space-y-4">
            {/* Header Bar */}
            <div className="flex justify-between items-center">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${color}`}>
                    {title}
                    {paused ? (
                        <span className="text-gray-400 text-xs">⏸ Paused</span>
                    ) : (
                        <span className="text-green-400 text-xs animate-pulse">🟢 Live</span>
                    )}
                </h2>

                {/* Search + Pause */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-2 py-1 text-sm rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none"
                    />
                    <button
                        onClick={() => setPaused((p) => !p)}
                        className={`px-3 py-1 rounded text-sm ${paused
                                ? "bg-yellow-600 hover:bg-yellow-500"
                                : "bg-gray-700 hover:bg-gray-600"
                            } text-white`}
                    >
                        {paused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                </div>
            </div>

            {/* Table / Content */}
            <div>{children}</div>
        </div>
    );
}
