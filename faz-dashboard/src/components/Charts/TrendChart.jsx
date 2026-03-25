import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TrendChart = ({ data, color = "#3b82f6" }) => {
    return (
        <div className="w-full h-full min-h-0" style={{ filter: 'drop-shadow(0 0 15px ' + color + '22)' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                            <stop offset="60%" stopColor={color} stopOpacity={0.1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="#ffffff"
                        opacity={0.03}
                    />
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                        dy={10}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                        domain={[0, 'auto']}
                        allowDataOverflow={true}
                        hide={false}
                    />
                    <Tooltip
                        cursor={{ stroke: color, strokeWidth: 2, strokeDasharray: '4 4' }}
                        contentStyle={{
                            backgroundColor: 'rgba(2, 6, 23, 0.95)',
                            border: `2px solid ${color}44`,
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '900',
                            backdropFilter: 'blur(20px)',
                            padding: '14px',
                            boxShadow: `0 0 30px ${color}22`
                        }}
                        itemStyle={{ color: color, textTransform: 'uppercase' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationBegin={0}
                        animationDuration={1200}
                        animationEasing="ease-in-out"
                        isAnimationActive={true}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2, shadow: '0 0 10px ' + color }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TrendChart;
