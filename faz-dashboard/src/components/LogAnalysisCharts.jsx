import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

const LogAnalysisCharts = ({ errorTrend, warningTrend, infoTrend }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Error Trend */}
            <div className="bg-[#1c1f26] p-4 rounded-xl shadow-lg">
                <h4 className="text-red-400 font-medium mb-2">Error Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={errorTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="timestamp" tick={{ fill: "#aaa", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#aaa", fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#111", border: "none" }} />
                        <Line type="monotone" dataKey="value" stroke="#ff4d4d" dot />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Warning Trend */}
            <div className="bg-[#1c1f26] p-4 rounded-xl shadow-lg">
                <h4 className="text-yellow-400 font-medium mb-2">Warning Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={warningTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="timestamp" tick={{ fill: "#aaa", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#aaa", fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#111", border: "none" }} />
                        <Line type="monotone" dataKey="value" stroke="#facc15" dot />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Info Trend */}
            <div className="bg-[#1c1f26] p-4 rounded-xl shadow-lg">
                <h4 className="text-blue-400 font-medium mb-2">Info Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={infoTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="timestamp" tick={{ fill: "#aaa", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#aaa", fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#111", border: "none" }} />
                        <Line type="monotone" dataKey="value" stroke="#60a5fa" dot />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default LogAnalysisCharts;
