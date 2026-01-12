// src/components/Footer.jsx
import React from "react";

export default function Footer() {
    return (
        <div className="w-full text-center py-4 mt-6 border-t border-borderColor relative">

            {/* Soft animated glow line */}
            <div className="absolute left-0 right-0 -top-[1px] h-[1px] bg-primary/30 animate-glow" />

            <p className="text-gray-400 text-xs tracking-wide">
                Powered by{" "}
                <span className="text-primary font-semibold drop-shadow-[0_0_8px_rgba(56,156,255,0.7)]">
                    QueryTel Inc.
                </span>
            </p>
        </div>
    );
}
