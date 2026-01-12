import React, { useState } from "react";
import Sidebar from "./Sidebar";

export default function PageWrapper({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="relative min-h-screen text-gray-100">

            {/* MOBILE HEADER */}
            <div className="lg:hidden p-3 bg-panel border-b border-borderColor flex items-center">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 bg-panel rounded hover:bg-gray-800 text-white"
                >
                    ☰
                </button>
                <span className="ml-3 font-semibold">QueryTel SOC v3</span>
            </div>

            {/* ❌ REMOVE THIS — Sidebar SHOULD NOT BE HERE */}
            {/* <Sidebar /> */}

            {/* ❌ REMOVE the sliding sidebar here also */}
            {/* Entire mobile drawer part goes away */}

            <div className="relative min-h-screen text-gray-100">
                {children}
            </div>
        </div>
    );
}
