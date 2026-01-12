import React from "react";

export default function LiveThreatRadar() {
    const dots = Array.from({ length: 24 });

    return (
        <div className="radar-wrapper flex flex-col items-center justify-center">
            <div className="radar-container">
                <div className="radar-ring"></div>
                <div className="radar-sweep"></div>

                {dots.map((_, i) => {
                    const angle = (i / dots.length) * 360;
                    const radius = 110;

                    const x = radius * Math.cos((angle * Math.PI) / 180);
                    const y = radius * Math.sin((angle * Math.PI) / 180);

                    return (
                        <div
                            key={i}
                            className="radar-dot"
                            style={{ transform: `translate(${x}px, ${y}px)` }}
                        ></div>
                    );
                })}
            </div>
        </div>
    );
}
