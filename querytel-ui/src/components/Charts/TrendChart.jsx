import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TrendChart = ({ title, data }) => {
    return (
        <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 h-[340px] group hover:border-blue-500/20 transition-all">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">{title}</h3>
                    <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1 uppercase">Live EPS / Real-time Throughput</p>
                </div>
            </div>
            <div className="w-full h-[200px] min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 9, fontWeight: 800 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 9, fontWeight: 800 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#3b82f6' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrendChart;
