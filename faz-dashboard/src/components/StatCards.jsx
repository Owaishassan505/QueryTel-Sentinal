// src/components/StatCards.jsx
import React from "react";

export default function StatCards({ stats }) {
  const cards = [
    { title: "Total Logs", value: stats.total, color: "text-blue-400" },
    { title: "Errors", value: stats.errors, color: "text-red-400" },
    { title: "Warnings", value: stats.warnings, color: "text-yellow-400" },
    { title: "Info", value: stats.info, color: "text-green-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.title}
          className="bg-[#181b29] p-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-transform"
        >
          <p className="text-sm text-gray-400">{c.title}</p>
          <h2 className={`text-2xl font-bold ${c.color}`}>{c.value}</h2>
        </div>
      ))}
    </div>
  );
}
