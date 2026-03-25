import React from 'react';
import { BarChart as RBChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0f172a] text-white text-[10px] p-2 rounded-xl shadow-2xl border border-white/10">
                <p className="font-black border-b border-white/5 pb-1 mb-1 uppercase tracking-widest text-indigo-400">{label}</p>
                <p className="text-slate-400 font-bold italic">Telemetry: <span className="text-white font-mono">{payload[0].value.toLocaleString()} pts</span></p>
            </div>
        );
    }
    return null;
};

const BarChart = ({ title, data, color = "#6366f1" }) => {
    return (
        <div className="flex flex-col h-[280px]">
            <h3 className="text-white font-black mb-3 text-[10px] uppercase tracking-[0.2em] italic border-b border-white/5 pb-3">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RBChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 9, fontWeight: 800 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 9, fontWeight: 800 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={2000}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index % 2 === 0 ? color : '#312e81'}
                                    className="hover:opacity-80 transition-opacity"
                                />
                            ))}
                        </Bar>
                    </RBChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BarChart;
