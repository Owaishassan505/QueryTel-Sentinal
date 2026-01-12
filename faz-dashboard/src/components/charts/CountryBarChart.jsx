// src/components/charts/CountryBarChart.jsx
import React from "react";
import { Bar } from "react-chartjs-2";

import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
);

export default function CountryBarChart({ data = [], onCountrySelect }) {

    const chartData = {
        labels: data.map(d => d.country),
        datasets: [
            {
                label: "Count",
                data: data.map(d => d.value),

                backgroundColor: "#0ea5e9",

                // 🔥 MAKE BARS FATTER
                barThickness: 32,
                maxBarThickness: 40,
                categoryPercentage: 0.6,
                barPercentage: 0.8,

                borderRadius: 8,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: { display: false }
        },

        scales: {
            y: { display: false },
            x: {
                ticks: {
                    color: "#ddd",
                    maxRotation: 0,
                    minRotation: 0,
                    autoSkip: false,
                }
            }
        },

        interaction: {
            mode: "nearest",
            intersect: true
        },

        onClick: (evt, elements) => {
            if (!elements.length) return;
            const index = elements[0].index;
            const country = chartData.labels[index];
            if (onCountrySelect) onCountrySelect(country);
        }
    };

    return (
        <div className="h-[350px] w-full">
            <Bar data={chartData} options={options} />
        </div>
    );
}
