// src/components/widgets/SystemHealthChips.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendURL } from "../../config";

export default function SystemHealthChips() {
    const [health, setHealth] = useState({
        status: "Loading",
        cpu: 0,
        ram: 0,
        alerts: 0,
        latency: 0,
    });

    // Fetch backend health every 5 seconds
    const fetchHealth = async () => {
        try {
            const res = await axios.get(`${backendURL}/api/health`);
            const d = res.data;

            setHealth({
                status: d.status === "Healthy" ? "Healthy" : "Issue",
                cpu: d.load || 0,
                ram: d.memoryMB || 0,
                alerts: d.activeAlerts || 0,
                latency: d.latency || 0,
            });
        } catch (err) {
            setHealth({ status: "Offline", cpu: 0, ram: 0, alerts: 0, latency: 0 });
        }
    };

    useEffect(() => {
        fetchHealth();
        const timer = setInterval(fetchHealth, 30000); // 30s interval to reduce server load
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex gap-2 items-center">

            {/* STATUS CHIP */}
            <span className={`
                px-3 py-1 rounded-full text-sm font-semibold 
                ${health.status === "Healthy" ? "bg-green-600 text-white" :
                    health.status === "Offline" ? "bg-red-600 text-white" :
                        "bg-yellow-500 text-black"}
            `}>
                🟢 {health.status}
            </span>

            {/* CPU */}
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-sm">
                🔵 CPU {health.cpu}%
            </span>

            {/* RAM */}
            <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-sm">
                🟣 RAM {health.ram}MB
            </span>

            {/* Active Alerts */}
            <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-sm">
                🟠 Alerts {health.alerts}
            </span>

            {/* API Latency */}
            <span className="px-3 py-1 rounded-full bg-yellow-400 text-black text-sm">
                🟡 API {health.latency}ms
            </span>
        </div>
    );
}
