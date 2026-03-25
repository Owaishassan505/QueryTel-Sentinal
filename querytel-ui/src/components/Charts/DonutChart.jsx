import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0f172a] text-white text-[10px] p-2 rounded-xl shadow-2xl border border-white/10">
                <p className="font-black mb-1 uppercase tracking-widest text-blue-500">{payload[0].name}</p>
                <p className="text-slate-400 font-bold">Total: <span className="text-white font-mono">{payload[0].value.toLocaleString()}</span></p>
            </div>
        );
    }
    return null;
};

const DonutChart = ({ title, data, colors }) => {
    const total = data.reduce((a, b) => a + b.value, 0);

    return (
        <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 pb-2 h-[280px] group hover:border-blue-500/20 transition-all">
            <h3 className="text-white font-black mb-3 text-[10px] uppercase tracking-[0.2em] italic border-b border-white/5 pb-3">{title}</h3>
            <div className="flex-1 w-full min-h-0 relative h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={10}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                    className="focus:outline-none cursor-pointer hover:opacity-80 transition-opacity"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="rect"
                            iconSize={8}
                            formatter={(value) => <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                    <div className="text-xl font-black text-white italic tracking-tighter">
                        {total > 1000 ? (total / 1000).toFixed(1) + 'k' : total}
                    </div>
                    <div className="text-[8px] text-slate-500 uppercase font-black tracking-[0.3em]">Total</div>
                </div>
            </div>
        </div>
    );
};

export default DonutChart;
