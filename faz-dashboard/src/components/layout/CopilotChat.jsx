import React, { useRef, useState } from "react";

export default function CopilotChat({ open, onClose }) {
    // Hooks MUST always run at top level
    const windowRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const startDrag = (e) => {
        if (!open) return;
        setDragging(true);
        const rect = windowRef.current.getBoundingClientRect();
        setOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const onDrag = (e) => {
        if (!dragging) return;
        setPos({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y,
        });
    };

    const stopDrag = () => setDragging(false);

    // UI is hidden when not open (instead of returning early)
    if (!open) {
        return null;
    }

    return (
        <div
            ref={windowRef}
            onMouseMove={onDrag}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            style={{
                position: "fixed",
                left: pos.x || "calc(100% - 420px)",
                top: pos.y || "calc(100% - 480px)",
                width: "400px",
                zIndex: 9999,
                transition: dragging ? "none" : "0.15s ease",
            }}
            className="rounded-2xl shadow-2xl backdrop-blur-xl bg-gray-900/80 border border-gray-700"
        >
            {/* Header */}
            <div
                onMouseDown={startDrag}
                className="cursor-move flex justify-between items-center p-4 
                rounded-t-2xl bg-gray-800/60 border-b border-gray-700 select-none"
            >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    🤖 QueryTel Copilot
                </h2>

                <button
                    onClick={onClose}
                    className="text-gray-300 hover:text-red-400 text-xl font-bold"
                >
                    ✖
                </button>
            </div>

            {/* Body */}
            <div className="p-4 text-gray-300 leading-relaxed text-sm">
                <div className="bg-gray-800/70 p-4 rounded-xl border border-gray-700 shadow-inner animate-pulse-slow">

                    <p className="text-base mb-2">
                        🛠️ <strong>Copilot is currently in development mode.</strong>
                    </p>

                    <p className="mt-1">
                        The AI assistant is being trained and integrated.
                        Expect powerful new features soon:
                    </p>

                    <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li>⚡ Real-time SOC intelligence</li>
                        <li>🧠 AI-powered smart reasoning</li>
                        <li>🔐 Automated incident insights</li>
                        <li>📡 Darkweb + Threat Feed analysis</li>
                    </ul>

                    <p className="mt-3 text-yellow-300 font-semibold">
                        ✨ Please check back in the next update!
                    </p>
                </div>
            </div>
        </div>
    );
}
