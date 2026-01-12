import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TopDestinationCountries({ onSelectCountry }) {
    const [list, setList] = useState([]);

    useEffect(() => {
        axios.get("/api/top/dst-countries").then(res => {
            if (res.data.ok) {
                setList(
                    res.data.data
                        .map(r => ({
                            country: r.country || "Unknown",
                            count: r.count || 0,
                        }))
                        .sort((a, b) => b.count - a.count)
                );
            }
        });
    }, []);

    const countryFlag = (code) => {
        if (!code || code === "Unknown") return "❓";
        return code
            .toUpperCase()
            .replace(/./g, char =>
                String.fromCodePoint(char.charCodeAt(0) + 127397)
            );
    };

    return (
        <div className="p-5 rounded-xl bg-[#0f0f10] border border-gray-800 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🌍 Top Destination Countries
            </h3>

            <div className="space-y-3">
                {list.map((item, index) => {
                    const max = list[0]?.count || 1;
                    const percentage = Math.round((item.count / max) * 100);

                    return (
                        <div
                            key={index}
                            onClick={() => onSelectCountry(item.country)}
                            className="flex items-center justify-between w-full cursor-pointer hover:bg-[#1a1a1c] p-2 rounded-lg transition"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{countryFlag(item.country)}</span>
                                <span className="text-gray-300 font-medium">{item.country}</span>
                            </div>

                            <div className="flex items-center gap-3 w-40">
                                <div className="text-gray-400 tabular-nums">{item.count}</div>
                                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
