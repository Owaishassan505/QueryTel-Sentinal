// src/pages/Logs.jsx
import React from "react";
import LogsTable from "../components/LogsTable";

export default function Logs() {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">📜 Unified Log Viewer</h2>
            <LogsTable />
        </div>
    );
}
