import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import io from "socket.io-client";

// Components
import Sidebar from "./components/Sidebar";
import LogDashboard from "./components/LogDashboard";

// Pages
import Analysis from "./pages/Analysis";
import InfoLogs from "./pages/InfoLogs";
import ErrorLogs from "./pages/ErrorLogs";
import WarningLogs from "./pages/WarningLogs";

// Intelligence Modules
import AIThreatInsights from "./components/AIThreatInsights";
import DarkwebMonitor from "./components/DarkwebMonitor";

/* -------------------------------------------------------------
   🔗 Persistent Socket Connection
   (keeps connection alive across all routes)
------------------------------------------------------------- */
const backendURL = "http://10.106.87.146:3320";
const socket = io(backendURL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 3000,
});

export default function App() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, info: 0, errors: 0, warnings: 0 });
  const [chartData, setChartData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  /* -------------------------------------------------------------
     📡 Socket.IO and Initial Data Fetch
  ------------------------------------------------------------- */
  useEffect(() => {
    // ✅ Connection lifecycle
    socket.on("connect", () => {
      console.log("✅ Dashboard socket connected");
      setIsConnected(true);
    });
    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Dashboard socket disconnected:", reason);
      setIsConnected(false);
    });

    // 🔹 Handle new alerts
    socket.on("alert:new", (log) => {
      setLogs((prev) => [log, ...(Array.isArray(prev) ? prev : [])].slice(0, 1000));
    });

    // 🔹 Handle updates
    socket.on("alert:update", (log) => {
      setLogs((prev) =>
        (Array.isArray(prev) ? prev : []).map((l) =>
          l.fingerprint === log.fingerprint ? log : l
        )
      );
    });

    // 🔹 Stats update
    socket.on("stats:update", (data) => {
      if (data) {
        setStats(data);
        const now = new Date().toISOString();
        setChartData((prev) => [
          ...prev,
          { time: now, errors: data.errors, warnings: data.warnings },
        ]);
      }
    });

    // 🔹 Initial dashboard fetch
    async function fetchInitialData() {
      try {
        const [logsRes, statsRes, chartRes] = await Promise.all([
          fetch(`${backendURL}/logs`).then((r) => r.json()),
          fetch(`${backendURL}/logs/stats`).then((r) => r.json()),
          fetch(`${backendURL}/logs/timeseries`).then((r) => r.json()),
        ]);

        setLogs(Array.isArray(logsRes.logs) ? logsRes.logs : []); // ✅ Fixed paginated API
        setStats(statsRes || { total: 0, info: 0, errors: 0, warnings: 0 });
        setChartData(Array.isArray(chartRes) ? chartRes : []);
      } catch (err) {
        console.error("❌ Failed to fetch initial dashboard data:", err);
      }
    }

    fetchInitialData();

    // 🧹 Cleanup only listeners
    return () => {
      socket.off("alert:new");
      socket.off("alert:update");
      socket.off("stats:update");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  /* -------------------------------------------------------------
     🧠 Derived Logs
  ------------------------------------------------------------- */
  const safeLogs = Array.isArray(logs) ? logs : [];
  const infoLogs = safeLogs.filter((log) => log.severity?.toLowerCase() === "info");
  const warningLogs = safeLogs.filter((log) =>
    ["warn", "warning"].includes(log.severity?.toLowerCase())
  );
  const errorLogs = safeLogs.filter((log) => log.severity?.toLowerCase() === "error");
  const recentLogs = safeLogs.slice(0, 10);

  /* -------------------------------------------------------------
     🖥️ Render App
  ------------------------------------------------------------- */
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Section */}
      <main className="flex-1 bg-gray-900 text-gray-100 min-h-screen p-6 overflow-y-auto relative">
        {/* 🟢 Connection Indicator */}
        <div className="absolute top-4 right-6 text-sm font-medium flex items-center gap-2">
          <span
            className={`inline-block w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
          ></span>
          {isConnected ? "Connected" : "Disconnected"}
        </div>

        <Routes>
          {/* Dashboard */}
          <Route
            path="/"
            element={<LogDashboard logs={recentLogs} stats={stats} chartData={chartData} />}
          />

          {/* Analysis */}
          <Route path="/analysis" element={<Analysis logs={safeLogs} />} />

          {/* AI Intelligence Modules */}
          <Route path="/ai-threat-insights" element={<AIThreatInsights />} />
          <Route path="/darkweb-intelligence" element={<DarkwebMonitor />} />

          {/* Log Categories */}
          <Route path="/logs/info" element={<InfoLogs logs={infoLogs} />} />
          <Route path="/logs/errors" element={<ErrorLogs logs={errorLogs} />} />
          <Route path="/logs/warnings" element={<WarningLogs logs={warningLogs} />} />
        </Routes>
      </main>
    </div>
  );
}
