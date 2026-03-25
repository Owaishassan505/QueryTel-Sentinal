import React, { useState, useEffect } from 'react';
import StatCard from '../components/Dashboard/StatCard';
import DonutChart from '../components/Charts/DonutChart';
import BarChart from '../components/Charts/BarChart';
import TrendChart from '../components/Charts/TrendChart';
import LogTable from '../components/Logs/LogTable';
import { Cpu, RefreshCw, Zap, ShieldCheck, Terminal, ChevronRight, Activity, Radar } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total: 15885,
        errors: 551,
        warnings: 614,
        info: 14603,
        ips: 794,
        failedLogin: 21,
        application: 136,
        bandwidth: "2.4 GB/s",
        stability: "99.98%"
    });

    const [logs, setLogs] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initial Data Load
    useEffect(() => {
        const initialTrend = Array.from({ length: 24 }, (_, i) => ({
            time: `${i}:00`,
            value: Math.floor(Math.random() * 80) + 20
        }));
        setTrendData(initialTrend);

        const initialLogs = Array.from({ length: 15 }, (_, i) => ({
            id: i,
            timestamp: new Date(Date.now() - i * 60000),
            severity: i % 5 === 0 ? 'Error' : i % 3 === 0 ? 'Warning' : 'Info',
            category: ['Traffic', 'Auth', 'Antivirus', 'DNS', 'SSL'][Math.floor(Math.random() * 5)],
            source: `192.168.1.${Math.floor(Math.random() * 255)}`,
            destination: `10.0.0.${Math.floor(Math.random() * 255)}`,
            message: 'Detected anomalous traffic pattern from external source.',
            port: '443'
        }));
        setLogs(initialLogs);

        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                total: prev.total + Math.floor(Math.random() * 2),
                ips: prev.ips + (Math.random() > 0.9 ? 1 : 0),
            }));

            if (Math.random() > 0.7) {
                const newLog = {
                    id: Date.now(),
                    timestamp: new Date(),
                    severity: Math.random() > 0.9 ? 'Error' : Math.random() > 0.7 ? 'Warning' : 'Info',
                    category: ['Traffic', 'Auth', 'Antivirus', 'DNS', 'SSL'][Math.floor(Math.random() * 5)],
                    source: `192.168.1.${Math.floor(Math.random() * 255)}`,
                    destination: `10.0.0.${Math.floor(Math.random() * 255)}`,
                    message: 'Tactical session established and verified by policy engine.',
                    port: '443'
                };
                setLogs(prev => [newLog, ...prev].slice(0, 50));
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const statCardsConfig = [
        { title: 'Security Events', value: stats.total, color: 'bg-blue-400', trend: '+12%', trendUp: true },
        { title: 'Critical Issues', value: stats.errors, color: 'bg-red-500', trend: '-2%', trendUp: false },
        { title: 'Warnings', value: stats.warnings, color: 'bg-amber-500', trend: '+5%', trendUp: true },
        { title: 'Normal Ops', value: stats.info, color: 'bg-emerald-400' },
        { title: 'IPS Attacks', value: stats.ips, color: 'bg-indigo-400' },
        { title: 'Auth Failures', value: stats.failedLogin, color: 'bg-orange-500', trend: 'High!', trendUp: false },
        { title: 'App Control', value: stats.application, color: 'bg-purple-400' },
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            {/* 1. PRIMARY METRICS MATRIX */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {statCardsConfig.map((card) => (
                    <StatCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        colorClass={card.color}
                        trend={card.trend}
                        trendUp={card.trendUp}
                    />
                ))}
            </div>

            {/* 2. VISUAL INTELLIGENCE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DonutChart
                            title="Threat Landscape analysis"
                            data={[
                                { name: 'Critical', value: stats.errors },
                                { name: 'Warning', value: stats.warnings },
                                { name: 'Operational', value: stats.info }
                            ]}
                            colors={['#f43f5e', '#facc15', '#3b82f6']}
                        />
                        <BarChart
                            title="Attack Vector distribution"
                            data={[
                                { name: 'IPS', value: stats.ips },
                                { name: 'SSL', value: 340 },
                                { name: 'DNS', value: 1205 },
                                { name: 'AUTH', value: stats.failedLogin },
                                { name: 'APP', value: stats.application },
                            ]}
                            color="#6366f1"
                        />
                    </div>
                    <TrendChart title="Global Ingress EPS Velocity" data={trendData} />
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* INFRASTRUCTURE HEALTH */}
                    <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                            Infrastructure Health <Cpu className="w-3.5 h-3.5 text-blue-500" />
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: 'Toronto-Core-DC', ip: '192.168.10.1', status: 'online', load: '14%' },
                                { name: 'Vancouver-Edge', ip: '10.50.80.12', status: 'online', load: '32%' },
                                { name: 'Halifax-Bridge', ip: '172.16.5.40', status: 'online', load: '8%' },
                                { name: 'Winnipeg-Node', ip: '10.10.20.1', status: 'maintenance', load: '0%' }
                            ].map((node, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{node.name}</p>
                                            <p className="text-[8px] font-mono text-slate-500 font-bold uppercase">{node.ip}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-600 uppercase">LOAD</p>
                                        <p className={`text-[10px] font-mono font-black ${node.status === 'online' ? 'text-blue-400' : 'text-slate-500'}`}>{node.load}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* NEURAL AWARENESS */}
                    <div className="bg-gradient-to-br from-[#1e1b4b]/40 to-[#0f172a]/60 backdrop-blur-3xl border border-indigo-500/10 rounded-[2.5rem] p-6 flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">Neural Awareness</h3>
                            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                        </div>
                        <div className="space-y-5">
                            <div className="relative pl-10">
                                <div className="absolute left-0 top-0 w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                                </div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active AI Shield</p>
                                <p className="text-xs text-slate-200 font-medium leading-relaxed italic">"Dynamic L7 inspection active across 24 edge nodes. No anomalous lateral movement detected in last 600s."</p>
                            </div>

                            <div className="h-px bg-white/5 w-full my-6"></div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] italic">System Entropy</span>
                                    <span className="text-[9px] font-mono text-emerald-500 font-black">STABLE</span>
                                </div>
                                <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden p-0.5">
                                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full w-[92%] shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <button className="p-3 bg-white/5 rounded-2xl border border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <Terminal className="w-3 h-3" /> Console
                                </button>
                                <button className="p-3 bg-blue-600 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] text-[9px] font-black text-white uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 italic">
                                    Audit <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. TACTICAL AUDIT MATRIX */}
            <div className="h-[600px] pb-4">
                <LogTable logs={logs} />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-spin-slow { animation: spin 20s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            ` }} />
        </div>
    );
};

export default Dashboard;
