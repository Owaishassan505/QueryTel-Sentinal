import React, { useState, useMemo } from "react";
import LogsTable from "../components/LogsTable";
import LogsLayout from "../components/LogsLayout";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";

export default function ErrorLogs({ logs = [] }) {
    const [paused, setPaused] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const filteredLogs = logs.filter(
            (log) => (log.severity || log.event?.severity || "").toLowerCase() === "error"
        );
        if (!search) return filteredLogs;
        return filteredLogs.filter((log) =>
            JSON.stringify(log).toLowerCase().includes(search.toLowerCase())
        );
    }, [logs, search]);

    const exportData = filtered.map((l) => ({
        Timestamp: new Date(l.ts || l.time).toLocaleString(),
        Severity: l.severity || l.event?.severity,
        Source: l.parsed?.srcip || "-",
        Destination: l.parsed?.dstip || "-",
        Action: l.parsed?.action || "-",
        Message: l.message || "-",
    }));

    return (
        <LogsLayout
            title="❌ Error Logs"
            color="text-red-400"
            paused={paused}
            setPaused={setPaused}
            search={search}
            setSearch={setSearch}
            onExportCSV={() => exportToCSV(exportData, "error_logs.csv")}
            onExportPDF={() => exportToPDF(exportData, "error_logs.pdf")}
        >
            <LogsTable logs={paused ? [] : filtered} />
        </LogsLayout>
    );
}
