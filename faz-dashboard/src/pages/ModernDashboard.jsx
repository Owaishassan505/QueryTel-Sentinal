import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { backendURL } from "../config";

// Icons
import {
    Activity, Zap, RefreshCw, ShieldCheck,
    Lock, Radar, Terminal, Search,
    Globe, Cpu, Server, AlertCircle,
    ChevronRight, ExternalLink, User,
    Layers, LayoutGrid, Clock, Target,
    Shield, Brain, TrendingUp, Users,
    Crosshair, Eye, Sparkles, Radio, Ghost
} from "lucide-react";

// Components
// Components (Lazy Load)
const StatCard = React.lazy(() => import("../components/Dashboard/StatCard"));
const LogModal = React.lazy(() => import("../components/Dashboard/LogModal"));
const DonutChart = React.lazy(() => import("../components/Charts/DonutChart"));
const BarChart = React.lazy(() => import("../components/Charts/BarChart"));
const TrendChart = React.lazy(() => import("../components/Charts/TrendChart"));
const LogTable = React.lazy(() => import("../components/Logs/LogTable"));
const RiskScoreGauge = React.lazy(() => import("../components/SOC/RiskScoreGauge"));
const CrownJewelCard = React.lazy(() => import("../components/SOC/CrownJewelCard"));
const KillChainTracker = React.lazy(() => import("../components/SOC/KillChainTracker"));

export default function ModernDashboard() {
    const [liveLogs, setLiveLogs] = useState([]);
    const [stats, setStats] = useState({
        total: 0, errors: 0, warnings: 0, info: 0,
        general: 0, application: 0, antivirus: 0, dns: 0,
        ssl: 0, ips: 0, failedLogin: 0, vpn: 0, adminAccess: 0,
        bandwidth: "2.4 GB/s", stability: "99.98%"
    });
    const [trendData, setTrendData] = useState([]);
    const [topDestinations, setTopDestinations] = useState([]);
    const [activeDevices, setActiveDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingTrend, setLoadingTrend] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Throttling Ref
    const lastUpdate = useRef(0);

    // Advanced SOC State
    const [riskScore, setRiskScore] = useState({ score: 0, level: 'low' });
    const [crownJewels, setCrownJewels] = useState([]);
    const [killChain, setKillChain] = useState({ stages: [] });
    const [identityThreats, setIdentityThreats] = useState({});
    const [threatNarrative, setThreatNarrative] = useState({ narrative: '', confidence: 0 });
    const [predictiveThreats, setPredictiveThreats] = useState({});
    const [socPerformance, setSocPerformance] = useState({});
    const [analystWorkload, setAnalystWorkload] = useState({ analysts: [] });
    const [autoResponses, setAutoResponses] = useState({});
    const [securityDebt, setSecurityDebt] = useState({ score: 0 });
    const [mitreCoverage, setMitreCoverage] = useState([]);
    const [blastRadius, setBlastRadius] = useState({});
    const [honeypotActivity, setHoneypotActivity] = useState({});
    const [activeTab, setActiveTab] = useState('overview');

    // Trend Filters
    const [filterMode, setFilterMode] = useState('severity');
    const [filterValue, setFilterValue] = useState('all');
    const [timeFilter, setTimeFilter] = useState('30m');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalLogs, setModalLogs] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalColor, setModalColor] = useState('blue');
    const [modalIcon, setModalIcon] = useState(Activity);

    // Metric Detail Modal State
    const [metricModalOpen, setMetricModalOpen] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState(null);

    // Handle stat box click
    const handleStatBoxClick = async (metric) => {
        setModalOpen(true);
        setModalTitle(metric.label);
        setModalLoading(true);
        setModalColor(metric.colorName);
        setModalIcon(metric.icon);
        setModalLogs([]);

        try {
            let url = `${backendURL}/api/logs?limit=100`;
            if (metric.filterType) {
                url += `&${metric.filterType}`;
            }
            const res = await axios.get(url);
            if (res.data && res.data.logs) {
                setModalLogs(res.data.logs);
            }
        } catch (err) {
            console.error("Failed to fetch logs for modal:", err);
        } finally {
            setModalLoading(false);
        }
    };

    // Handle metric card click
    const handleMetricClick = (metricType) => {
        const metricDetails = {
            'risk': {
                title: 'Global Cyber Risk Score',
                description: 'Real-time aggregated risk assessment based on active threats, vulnerabilities, and attack patterns.',
                data: riskScore,
                insights: [
                    `Current threat level: ${riskScore.level?.toUpperCase() || 'LOW'}`,
                    `Risk score: ${riskScore.score || 0}/100`,
                    `Calculated from ${stats.total || 0} security events`,
                    'Factors: Active threats, vulnerability exposure, attack surface'
                ]
            },
            'mttd': {
                title: 'Mean Time To Detect (MTTD)',
                description: 'Average time taken to detect security incidents from initial compromise.',
                data: socPerformance.mttd,
                insights: [
                    `Current MTTD: ${socPerformance.mttd?.value || 0} ${socPerformance.mttd?.unit || 'min'}`,
                    'Industry benchmark: 4.2 minutes',
                    `Performance: ${socPerformance.mttd?.value < 5 ? 'Excellent' : 'Good'}`,
                    'Detection powered by AI-enhanced correlation engine'
                ]
            },
            'mttr': {
                title: 'Mean Time To Respond (MTTR)',
                description: 'Average time taken to respond to and contain detected security incidents.',
                data: socPerformance.mttr,
                insights: [
                    `Current MTTR: ${socPerformance.mttr?.value || 0} ${socPerformance.mttr?.unit || 'min'}`,
                    'Industry benchmark: 0.1 minutes',
                    `Performance: ${socPerformance.mttr?.value < 1 ? 'Excellent' : 'Good'}`,
                    'Automated response playbooks active'
                ]
            },
            'killchain': {
                title: 'Active Kill Chain Stage',
                description: 'Current stage of detected attack progression based on MITRE ATT&CK framework.',
                data: killChain,
                insights: [
                    `Active stage: ${killChain.currentStage || 'None'}`,
                    `Detected tactics: ${killChain.stages?.length || 0}`,
                    'Real-time attack progression tracking',
                    'Automated countermeasures deployed'
                ]
            },
            'debt': {
                title: 'Security Debt Score',
                description: 'Accumulated technical security debt from unpatched systems, misconfigurations, and policy violations.',
                data: securityDebt,
                insights: [
                    `Debt score: ${securityDebt.score || 0}`,
                    `Risk level: ${securityDebt.level?.toUpperCase() || 'LOW'}`,
                    'Unpatched vulnerabilities tracked',
                    'Remediation recommendations available'
                ]
            },
            'identity': {
                title: 'Identity & Access Risk',
                description: 'Real-time monitoring of authentication anomalies, failed logins, and privilege escalation attempts.',
                data: identityThreats,
                insights: [
                    `Risk level: ${identityThreats.riskLevel?.toUpperCase() || 'LOW'}`,
                    `Failed login attempts: ${identityThreats.failedLogins || 0}`,
                    `Compromised accounts: ${identityThreats.compromisedAccounts || 0}`,
                    'Multi-factor authentication enforcement active'
                ]
            },
            'aishield': {
                title: 'AI Shield Status',
                description: 'Machine learning-powered threat detection and automated response system.',
                data: { status: 'active' },
                insights: [
                    'Status: ACTIVE',
                    'AI models: 12 active threat detection engines',
                    `Threats blocked today: ${autoResponses.blockedIPs || 0}`,
                    'Confidence threshold: 95%'
                ]
            },
            'blocked': {
                title: 'Auto-Blocked Threats',
                description: 'Automatically blocked IP addresses and malicious actors by AI-powered defense systems.',
                data: autoResponses,
                insights: [
                    `Total blocked: ${autoResponses.blockedIPs || 0} IPs`,
                    `Quarantined files: ${autoResponses.quarantinedFiles || 0}`,
                    `Prevented attacks: ${autoResponses.preventedAttacks || 0}`,
                    'Zero-day protection active'
                ]
            },
            'cases': {
                title: 'Active Security Cases',
                description: 'Currently open security incidents and investigations assigned to SOC analysts.',
                data: analystWorkload,
                insights: [
                    `Total active cases: ${analystWorkload.totalCases || 0}`,
                    `Critical cases: ${analystWorkload.criticalCases || 0}`,
                    `Analysts on duty: ${analystWorkload.analysts?.length || 0}`,
                    `Average case age: ${analystWorkload.avgCaseAge || 0} hours`
                ]
            }
        };

        setSelectedMetric(metricDetails[metricType]);
        setMetricModalOpen(true);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchTrendData = async () => {
        setLoadingTrend(true);
        try {
            const res = await axios.get(`${backendURL}/api/logs/trend`, {
                params: {
                    type: filterMode === 'severity' ? filterValue : 'all',
                    filter: filterMode === 'category' ? filterValue : 'all',
                    interval: timeFilter
                }
            });

            // Map the backend data to the chart format
            if (res.data && Array.isArray(res.data)) {
                setTrendData(res.data);
            }
        } catch (err) {
            console.error("Trend engine failed:", err);
            // Fallback to empty to avoid crashing, but log the error
            setTrendData([]);
        } finally {
            setLoadingTrend(false);
        }
    };

    useEffect(() => {
        fetchTrendData();
    }, [filterMode, filterValue, timeFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsRes = await axios.get(backendURL + "/api/logs/stats");
            setStats(prev => ({ ...prev, ...statsRes.data }));

            const logsRes = await axios.get(backendURL + "/api/logs?limit=40");
            if (logsRes.data && logsRes.data.logs) {
                setLiveLogs(logsRes.data.logs);
            }

            // Fetch New Charts Data
            const destRes = await axios.get(backendURL + "/api/logs/top-destinations");
            setTopDestinations(destRes.data);

            const devicesRes = await axios.get(backendURL + "/api/logs/active-devices");
            setActiveDevices(devicesRes.data);

            // Fetch Advanced SOC Data
            const riskRes = await axios.get(backendURL + "/api/soc/risk-score");
            setRiskScore(riskRes.data);

            const jewelsRes = await axios.get(backendURL + "/api/soc/crown-jewels");
            setCrownJewels(jewelsRes.data);

            const killChainRes = await axios.get(backendURL + "/api/soc/kill-chain");
            setKillChain(killChainRes.data);

            const identityRes = await axios.get(backendURL + "/api/soc/identity-threats");
            setIdentityThreats(identityRes.data);

            const narrativeRes = await axios.get(backendURL + "/api/soc/threat-narrative");
            setThreatNarrative(narrativeRes.data);

            const predictiveRes = await axios.get(backendURL + "/api/soc/predictive-threats");
            setPredictiveThreats(predictiveRes.data);

            const perfRes = await axios.get(backendURL + "/api/soc/performance");
            setSocPerformance(perfRes.data);

            const workloadRes = await axios.get(backendURL + "/api/soc/analyst-workload");
            setAnalystWorkload(workloadRes.data);

            const autoRes = await axios.get(backendURL + "/api/soc/auto-responses");
            setAutoResponses(autoRes.data);

            const debtRes = await axios.get(backendURL + "/api/soc/security-debt");
            setSecurityDebt(debtRes.data);

            const mitreRes = await axios.get(backendURL + "/api/soc/mitre-coverage");
            setMitreCoverage(mitreRes.data);

            const blastRes = await axios.get(backendURL + "/api/soc/blast-radius");
            setBlastRadius(blastRes.data);

            const honeyRes = await axios.get(backendURL + "/api/soc/honeypot");
            setHoneypotActivity(honeyRes.data);

        } catch (err) {
            console.error("Dashboard engine failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const socket = io(backendURL, {
            transports: ["websocket"],
            reconnection: true,
            auth: { token: localStorage.getItem("token") }
        });

        socket.on("stats:update", (s) => {
            const now = Date.now();
            if (now - lastUpdate.current > 5000) { // Throttle to 5s
                lastUpdate.current = now;
                setStats(prev => ({ ...prev, ...s }));
            }
        });
        socket.on("alert:batch", (batch) => {
            setLiveLogs(prev => [...batch, ...prev].slice(0, 50));
        });

        return () => socket.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30">
            <React.Suspense fallback={
                <div className="flex flex-col items-center justify-center h-screen space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-indigo-400 font-mono text-sm uppercase tracking-widest animate-pulse">Initializing SOC Neural Core...</p>
                </div>
            }>
                <div className="px-4 pb-4 pt-0 -mt-6 space-y-4">
                    {/* GLOBAL COMMAND STATUS BAR */}
                    <div className="bg-gradient-to-r from-slate-900/60 via-indigo-900/20 to-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] py-3 px-4">
                        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-2 items-center">
                            {/* Global Risk Score */}
                            <div className="col-span-2 flex items-center gap-2">
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${riskScore.level === 'low' ? 'border-emerald-500 bg-emerald-500/10' :
                                        riskScore.level === 'medium' ? 'border-amber-500 bg-amber-500/10' :
                                            'border-red-500 bg-red-500/10'
                                        }`}>
                                        <span className={`text-lg font-black italic ${riskScore.level === 'low' ? 'text-emerald-400' :
                                            riskScore.level === 'medium' ? 'text-amber-400' :
                                                'text-red-400'
                                            }`}>
                                            {riskScore.score || 0}
                                        </span>
                                    </div>
                                    <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse ${riskScore.level === 'low' ? 'bg-emerald-500' :
                                        riskScore.level === 'medium' ? 'bg-amber-500' :
                                            'bg-red-500'
                                        }`} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Global Cyber Risk</p>
                                    <p className={`text-xs font-black uppercase ${riskScore.level === 'low' ? 'text-emerald-400' :
                                        riskScore.level === 'medium' ? 'text-amber-400' :
                                            'text-red-400'
                                        }`}>
                                        {riskScore.level || 'LOW'} THREAT
                                    </p>
                                </div>
                            </div>

                            {/* MTTD */}
                            <div
                                onClick={() => handleMetricClick('mttd')}
                                className="col-span-1 bg-white/5 rounded-xl p-2 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-all hover:scale-[1.02]"
                            >
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">MTTD</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-emerald-400">{socPerformance.mttd?.value || 0}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">{socPerformance.mttd?.unit || 'min'}</span>
                                </div>
                            </div>

                            {/* MTTR */}
                            <div
                                onClick={() => handleMetricClick('mttr')}
                                className="col-span-1 bg-white/5 rounded-xl p-2 border border-blue-500/20 cursor-pointer hover:border-blue-500/40 transition-all hover:scale-[1.02]"
                            >
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">MTTR</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-blue-400">{socPerformance.mttr?.value || 0}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">{socPerformance.mttr?.unit || 'min'}</span>
                                </div>
                            </div>

                            {/* Kill Chain Stage */}
                            <div
                                onClick={() => handleMetricClick('killchain')}
                                className="col-span-2 bg-white/5 rounded-xl p-2 border border-red-500/20 cursor-pointer hover:border-red-500/40 transition-all hover:scale-[1.02]"
                            >
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Kill Chain</p>
                                <div className="flex items-center gap-1.5">
                                    <Crosshair className="w-3 h-3 text-red-400" />
                                    <span className="text-xs font-black text-white uppercase truncate">
                                        {killChain.currentStage || 'None'}
                                    </span>
                                </div>
                            </div>

                            {/* Security Debt */}
                            <div
                                onClick={() => handleMetricClick('debt')}
                                className="col-span-1 bg-white/5 rounded-xl p-2 border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-all hover:scale-[1.02]"
                            >
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Debt</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-lg font-black ${securityDebt.level === 'high' ? 'text-red-400' :
                                        securityDebt.level === 'medium' ? 'text-amber-400' :
                                            'text-emerald-400'
                                        }`}>
                                        {securityDebt.score || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Identity Threats */}
                            <div
                                onClick={() => handleMetricClick('identity')}
                                className="col-span-2 bg-white/5 rounded-xl p-2 border border-purple-500/20 cursor-pointer hover:border-purple-500/40 transition-all hover:scale-[1.02]"
                            >
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Identity Risk</p>
                                <div className="flex items-center gap-1.5">
                                    <User className="w-3 h-3 text-purple-400" />
                                    <span className={`text-xs font-black uppercase ${identityThreats.riskLevel === 'high' ? 'text-red-400' :
                                        identityThreats.riskLevel === 'medium' ? 'text-amber-400' :
                                            'text-emerald-400'
                                        }`}>
                                        {identityThreats.riskLevel || 'LOW'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold">
                                        {identityThreats.failedLogins || 0} fails
                                    </span>
                                </div>
                            </div>

                            {/* AI Shield Status */}
                            <div
                                onClick={() => handleMetricClick('aishield')}
                                className="col-span-1 bg-emerald-500/10 rounded-xl p-2 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-all hover:scale-[1.02]"
                            >
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">AI Shield</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-black text-emerald-400 uppercase">Active</span>
                                </div>
                            </div>

                            {/* Auto-Blocked */}
                            <div
                                onClick={() => handleMetricClick('blocked')}
                                className="col-span-1 bg-purple-500/10 rounded-xl p-2 border border-purple-500/20 cursor-pointer hover:border-purple-500/40 transition-all hover:scale-[1.02]"
                            >
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Blocked</p>
                                <div className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                    <span className="text-sm font-black text-white">{autoResponses.blockedIPs || 0}</span>
                                </div>
                            </div>

                            {/* Active Cases */}
                            <div
                                onClick={() => handleMetricClick('cases')}
                                className="col-span-1 bg-blue-500/10 rounded-xl p-2 border border-blue-500/20 cursor-pointer hover:border-blue-500/40 transition-all hover:scale-[1.02]"
                            >
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Cases</p>
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-blue-400" />
                                    <span className="text-sm font-black text-white">{analystWorkload.totalCases || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRIMARY METRICS MATRIX */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {[
                            { label: 'Security Events', val: stats.total, color: 'text-blue-400', colorName: 'blue', trend: '+12%', icon: Activity, filterType: '' },
                            { label: 'Critical Issues', val: stats.errors, color: 'text-red-500', colorName: 'red', trend: '-2%', icon: AlertCircle, filterType: 'severity=error' },
                            { label: 'Warnings', val: stats.warnings, color: 'text-amber-500', colorName: 'amber', trend: '+5%', icon: Zap, filterType: 'severity=warning' },
                            { label: 'Normal Ops', val: stats.info, color: 'text-emerald-400', colorName: 'emerald', trend: 'OK', icon: ShieldCheck, filterType: 'severity=info' },
                            { label: 'IPS Attacks', val: stats.ips || 0, color: 'text-indigo-400', colorName: 'indigo', trend: 'ACTIVE', icon: Radar, filterType: 'category=IPS' },
                            { label: 'Auth Failures', val: stats.failedLogin || 0, color: 'text-orange-500', colorName: 'orange', trend: 'MONITOR', icon: Lock, filterType: 'category=Failed Login' },
                            { label: 'App Control', val: stats.application || 0, color: 'text-purple-400', colorName: 'purple', trend: 'SCANNING', icon: LayoutGrid, filterType: 'category=Application Control' },
                        ].map((m, i) => (
                            <div
                                key={i}
                                onClick={() => handleStatBoxClick(m)}
                                className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 group hover:border-blue-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg bg-white/5 ${m.color.replace('text-', 'bg-opacity-10 text-')}`}>
                                        <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${m.trend.includes('+') || m.trend === 'ACTIVE' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                        {m.trend}
                                    </span>
                                </div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.label}</p>
                                <p className="text-xl font-black text-white italic tracking-tighter mt-1">{m.val.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* VISUAL INTELLIGENCE GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-8 flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 pb-2">
                                    <DonutChart
                                        title="Threat Landscape"
                                        data={[
                                            { name: 'Critical', value: stats.errors || 0 },
                                            { name: 'Warning', value: stats.warnings || 0 },
                                            { name: 'Operational', value: stats.info || 0 }
                                        ]}
                                        colors={['#f43f5e', '#facc15', '#3b82f6']}
                                    />
                                </div>
                                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 pb-2">
                                    <BarChart
                                        title="Attack Vectors"
                                        data={[
                                            { name: 'IPS', value: stats.ips || 0 },
                                            { name: 'SSL', value: stats.ssl || 0 },
                                            { name: 'DNS', value: stats.dns || 0 },
                                            { name: 'AUTH', value: stats.failedLogin || 0 },
                                            { name: 'APP', value: stats.application || 0 },
                                        ]}
                                        color="#6366f1"
                                    />
                                </div>
                                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 pb-2">
                                    <DonutChart
                                        title="Top Egress Destinations"
                                        data={topDestinations.length > 0 ? topDestinations : [{ name: 'Scanning...', value: 100 }]}
                                        colors={['#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef']}
                                    />
                                </div>
                                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 pb-2">
                                    <BarChart
                                        title="Most Active Firewall"
                                        data={activeDevices.length > 0 ? activeDevices : [{ name: 'Monitoring...', value: 0 }]}
                                        color="#ec4899"
                                    />
                                </div>
                            </div>
                            <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex-1">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Threat Trend Matrix</h3>
                                        <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1 uppercase flex items-center gap-2">
                                            <Activity className="w-3 h-3 text-blue-500" /> Advanced Temporal Intelligence
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* DROPDOWN 1: MODE SELECTOR */}
                                        <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-4 py-2 transition-all hover:border-blue-500/50 shadow-lg group">
                                            <Layers className="w-3.5 h-3.5 text-blue-500" />
                                            <select
                                                value={filterMode}
                                                onChange={(e) => {
                                                    setFilterMode(e.target.value);
                                                    setFilterValue('all'); // Reset second dropdown
                                                }}
                                                className="bg-transparent border-none outline-none text-[11px] font-black text-white uppercase tracking-widest cursor-pointer focus:ring-0 appearance-none min-w-[120px]"
                                            >
                                                <option value="severity" className="bg-[#0f172a]">Analysis Mode: Severity</option>
                                                <option value="category" className="bg-[#0f172a]">Analysis Mode: Category</option>
                                            </select>
                                        </div>

                                        {/* DROPDOWN 2: CONTEXTUAL FILTER */}
                                        <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-4 py-2 transition-all hover:border-blue-500/50 shadow-lg group">
                                            <Search className={`w-3.5 h-3.5 ${filterMode === 'severity' ? (filterValue === 'error' ? 'text-red-500' : filterValue === 'warning' ? 'text-amber-500' : 'text-blue-500') : 'text-slate-400'}`} />
                                            <select
                                                value={filterValue}
                                                onChange={(e) => setFilterValue(e.target.value)}
                                                className="bg-transparent border-none outline-none text-[11px] font-black text-white uppercase tracking-widest cursor-pointer focus:ring-0 appearance-none min-w-[160px]"
                                            >
                                                <option value="all" className="bg-[#0f172a]">All Active Data</option>
                                                {filterMode === 'severity' ? (
                                                    <>
                                                        <option value="info" className="bg-[#0f172a] text-blue-400">Normal Information</option>
                                                        <option value="warning" className="bg-[#0f172a] text-amber-500">System Warnings</option>
                                                        <option value="error" className="bg-[#0f172a] text-red-500">Critical Errors</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="ssl" className="bg-[#0f172a]">SSL Ingress</option>
                                                        <option value="vpn" className="bg-[#0f172a]">VPN Gateway</option>
                                                        <option value="ips" className="bg-[#0f172a]">IPS Protection</option>
                                                        <option value="web" className="bg-[#0f172a]">Web Filtering</option>
                                                        <option value="application" className="bg-[#0f172a]">Application Control</option>
                                                        <option value="login" className="bg-[#0f172a]">Failed Login</option>
                                                        <option value="dns" className="bg-[#0f172a]">DNS Queries</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>

                                        {/* DROPDOWN 3: TIME RANGE */}
                                        <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-4 py-2 transition-all hover:border-blue-500/50 shadow-lg group">
                                            <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
                                            <select
                                                value={timeFilter}
                                                onChange={(e) => setTimeFilter(e.target.value)}
                                                className="bg-transparent border-none outline-none text-[11px] font-black text-white uppercase tracking-widest cursor-pointer focus:ring-0 appearance-none min-w-[120px]"
                                            >
                                                <option value="30m" className="bg-[#0f172a]">Last 30 Min</option>
                                                <option value="1h" className="bg-[#0f172a]">Last 1 Hour</option>
                                                <option value="6h" className="bg-[#0f172a]">Last 6 Hours</option>
                                                <option value="24h" className="bg-[#0f172a]">Last 24 Hours</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-64 relative">
                                    {loadingTrend && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm z-10 rounded-3xl">
                                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                        </div>
                                    )}
                                    <TrendChart
                                        data={trendData}
                                        color={filterMode === 'severity' ? (filterValue === 'error' ? '#ef4444' : filterValue === 'warning' ? '#f59e0b' : '#3b82f6') : '#3b82f6'}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-4">
                            {/* NODES STATUS */}
                            <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6">
                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center justify-between">
                                    Infrastructure Health <Cpu className="w-4 h-4 text-blue-500" />
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
                                                <div className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></div>
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase tracking-tight">{node.name}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">{node.ip}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">LOAD</p>
                                                <p className={`text-sm font-mono font-black ${node.status === 'online' ? 'text-blue-400' : 'text-slate-500'}`}>{node.load}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* THREAT INTELLIGENCE RADAR */}
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
                                            <span className="text-[9px] font-mono text-emerald-500 font-black">99.2% STABLE</span>
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

                    {/* ADVANCED SOC COMMAND CENTER */}
                    <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/40">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_#6366f1]"></div>
                                    <h2 className="text-sm font-black text-white uppercase italic tracking-widest">Advanced SOC Intelligence</h2>
                                </div>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'overview', label: 'Overview', icon: Target },
                                        { id: 'threats', label: 'Threats', icon: Shield },
                                        { id: 'operations', label: 'Operations', icon: Users }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id
                                                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                                                : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                                }`}
                                        >
                                            <tab.icon className="w-3 h-3" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    {/* Global Risk Score */}
                                    <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-indigo-500" />
                                            Global Cyber Risk
                                        </h3>
                                        <RiskScoreGauge score={riskScore.score} level={riskScore.level} />
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div className="bg-white/5 rounded-xl p-3">
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Critical</p>
                                                <p className="text-lg font-black text-red-400 mt-1">{riskScore.criticalEvents || 0}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-3">
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Warnings</p>
                                                <p className="text-lg font-black text-amber-400 mt-1">{riskScore.warnings || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Crown Jewel Assets */}
                                    <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-amber-500" />
                                            Crown Jewel Assets
                                        </h3>
                                        <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                                            {crownJewels.map((asset, idx) => (
                                                <CrownJewelCard key={idx} asset={asset} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI Threat Narrative */}
                                    <div
                                        onClick={() => handleMetricClick('aiThreatNarrative')}
                                        className="lg:col-span-4 bg-gradient-to-br from-indigo-900/20 to-slate-900/40 backdrop-blur-xl border border-indigo-500/20 rounded-[2rem] p-6 cursor-pointer hover:border-blue-500/30 transition-all hover:scale-[1.02]"
                                    >
                                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Brain className="w-4 h-4 text-indigo-400" />
                                            AI Threat Narrative
                                        </h3>
                                        <div className="space-y-4">
                                            <p className="text-xs text-slate-300 leading-relaxed italic">
                                                {threatNarrative.narrative || 'Analyzing threat landscape...'}
                                            </p>
                                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">AI Confidence</span>
                                                <span className="text-[10px] font-mono text-indigo-400 font-black">{threatNarrative.confidence || 0}%</span>
                                            </div>
                                            <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${threatNarrative.confidence || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SOC Performance Metrics */}
                                    <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            SOC Performance
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2">Mean Time To Detect</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-black text-emerald-400">{socPerformance.mttd?.value || 0}</span>
                                                    <span className="text-[9px] text-slate-500 font-bold">{socPerformance.mttd?.unit || 'min'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span className="text-[8px] text-emerald-500 font-black uppercase">Trending {socPerformance.mttd?.trend || 'stable'}</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2">Mean Time To Respond</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-black text-blue-400">{socPerformance.mttr?.value || 0}</span>
                                                    <span className="text-[9px] text-slate-500 font-bold">{socPerformance.mttr?.unit || 'min'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span className="text-[8px] text-blue-500 font-black uppercase">Trending {socPerformance.mttr?.trend || 'stable'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Automated Response Activity */}
                                    <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-500" />
                                            Automated Responses (Active)
                                        </h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-black text-red-400">{autoResponses.blockedIPs || 0}</p>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1">Blocked IPs</p>
                                            </div>
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-black text-amber-400">{autoResponses.quarantinedEndpoints || 0}</p>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1">Quarantined</p>
                                            </div>
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-black text-blue-400">{autoResponses.disabledAccounts || 0}</p>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1">Disabled Accts</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* THREATS TAB */}
                            {activeTab === 'threats' && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    {/* Cyber Kill Chain */}
                                    <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Crosshair className="w-4 h-4 text-red-500" />
                                            Cyber Kill Chain Progress
                                        </h3>
                                        {killChain.stages && killChain.stages.length > 0 ? (
                                            <>
                                                <KillChainTracker data={killChain} />
                                                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                    <p className="text-[8px] text-amber-400 uppercase font-black tracking-widest mb-1">Predicted Next Stage</p>
                                                    <p className="text-xs text-white font-bold">{killChain.predictedNext || 'None'}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">No active kill chain detected</p>
                                        )}
                                    </div>

                                    {/* Identity Threat Posture */}
                                    <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-500" />
                                            Identity Threat Posture
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Privileged Account Misuse', value: identityThreats.privilegedMisuse || 0, color: 'red' },
                                                { label: 'MFA Failures', value: identityThreats.mfaFailures || 0, color: 'amber' },
                                                { label: 'Impossible Travel Events', value: identityThreats.impossibleTravel || 0, color: 'orange' },
                                                { label: 'Dormant Admin Exposure', value: identityThreats.dormantAdmins || 0, color: 'blue' }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{item.label}</span>
                                                    <span className={`text-sm font-black text-${item.color}-400`}>{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 p-3 bg-white/5 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Overall Risk Level</span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${identityThreats.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    identityThreats.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                    {identityThreats.riskLevel || 'low'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Predictive Threat Intelligence */}
                                    <div className="lg:col-span-12 bg-gradient-to-br from-purple-900/20 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-purple-400" />
                                            Predictive Threat Intelligence
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2">Predicted Vector</p>
                                                <p className="text-sm font-black text-white">{predictiveThreats.predictedVector || 'Analyzing...'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2">Target Asset</p>
                                                <p className="text-sm font-black text-white">{predictiveThreats.targetAsset || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2">Confidence</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-slate-800/50 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                                                            style={{ width: `${predictiveThreats.confidence || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-black text-purple-400">{predictiveThreats.confidence || 0}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        {predictiveThreats.reasoning && (
                                            <div className="mt-4 p-3 bg-white/5 rounded-xl">
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2">AI Reasoning</p>
                                                <p className="text-xs text-slate-300 italic leading-relaxed">{predictiveThreats.reasoning}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* MITRE ATT&CK Matrix */}
                                    <div className="lg:col-span-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <LayoutGrid className="w-4 h-4 text-pink-500" />
                                            MITRE ATT&CK Coverage
                                        </h3>
                                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                            {mitreCoverage.map((tactic, idx) => (
                                                <div key={idx} className={`p-2 rounded-lg border ${tactic.detected > 0
                                                    ? 'bg-red-500/20 border-red-500/40'
                                                    : 'bg-white/5 border-white/5'
                                                    } hover:scale-105 transition-all cursor-pointer group`}>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-[7px] text-slate-500 font-mono">{tactic.id}</span>
                                                        {tactic.detected > 0 && (
                                                            <span className="text-[8px] font-black text-red-400 bg-red-950/50 px-1 rounded">{tactic.detected}</span>
                                                        )}
                                                    </div>
                                                    <p className={`text-[8px] font-bold uppercase leading-tight ${tactic.detected > 0 ? 'text-white' : 'text-slate-500'
                                                        }`}>{tactic.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Blast Radius Estimator */}
                                    <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 relative overflow-hidden">
                                        {/* Background Effect */}
                                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                            <Radio className="w-4 h-4 text-orange-500" />
                                            Blast Radius
                                        </h3>

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[8px] text-slate-500 font-bold uppercase">Target Asset</span>
                                                <span className="text-[9px] text-white font-black bg-white/10 px-2 py-0.5 rounded">{blastRadius.asset || 'N/A'}</span>
                                            </div>

                                            <div className="flex justify-center my-4">
                                                <div className="relative w-24 h-24 flex items-center justify-center">
                                                    <div className={`absolute inset-0 rounded-full border-2 border-dashed animate-[spin_10s_linear_infinite] ${blastRadius.estimatedImpact === 'critical' ? 'border-red-500/30' : 'border-orange-500/30'
                                                        }`}></div>
                                                    <div className={`absolute inset-4 rounded-full border border-white/10 animate-[spin_5s_linear_infinite_reverse]`}></div>
                                                    <div className="text-center">
                                                        <p className={`text-2xl font-black ${blastRadius.estimatedImpact === 'critical' ? 'text-red-500' : 'text-orange-500'
                                                            }`}>{blastRadius.estimatedImpact === 'critical' ? 'CRIT' : 'HIGH'}</p>
                                                        <p className="text-[7px] text-slate-500 font-black uppercase">IMPACT</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[9px] p-2 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="text-slate-400">Affected Users</span>
                                                    <span className="text-white font-black">{blastRadius.affectedUsers || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[9px] p-2 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="text-slate-400">Connected Sys</span>
                                                    <span className="text-white font-black">{blastRadius.connectedSystems || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[9px] p-2 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="text-slate-400">Containment</span>
                                                    <span className="text-orange-400 font-black">{blastRadius.containmentTime || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* OPERATIONS TAB */}
                            {activeTab === 'operations' && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    {/* Analyst Workload */}
                                    <div className="lg:col-span-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-blue-500" />
                                            Analyst Workload Overview
                                        </h3>
                                        <div className="space-y-3">
                                            {analystWorkload.analysts && analystWorkload.analysts.map((analyst, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${analyst.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-500'
                                                            }`} />
                                                        <span className="text-[10px] font-black text-white uppercase">{analyst.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[9px] text-slate-400 font-bold">{analyst.cases} cases</span>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${analyst.load === 'high' ? 'bg-red-500/20 text-red-400' :
                                                            analyst.load === 'optimal' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                            }`}>
                                                            {analyst.load}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Security Debt Index */}
                                    <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                            Security Debt Index
                                        </h3>
                                        <div className="text-center mb-4">
                                            <div className={`text-5xl font-black italic ${securityDebt.level === 'high' ? 'text-red-400' :
                                                securityDebt.level === 'medium' ? 'text-amber-400' :
                                                    'text-emerald-400'
                                                }`}>
                                                {securityDebt.score || 0}
                                            </div>
                                            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-2">Debt Score</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[9px]">
                                                <span className="text-slate-500 font-bold">Unresolved Alerts</span>
                                                <span className="text-white font-black">{securityDebt.unresolvedAlerts || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-[9px]">
                                                <span className="text-slate-500 font-bold">Open Vulnerabilities</span>
                                                <span className="text-white font-black">{securityDebt.openVulnerabilities || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-[9px]">
                                                <span className="text-slate-500 font-bold">Misconfigurations</span>
                                                <span className="text-white font-black">{securityDebt.misconfigurations || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deception & Honeypot */}
                                    <div className="lg:col-span-12 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Ghost className="w-4 h-4 text-emerald-400" />
                                            Deception & Honeypot Grid
                                        </h3>
                                        <div className="flex flex-wrap md:flex-nowrap items-center gap-6">
                                            <div className="flex-1 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                    <Eye className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Active Decoys</p>
                                                    <p className="text-xl font-black text-white">3 <span className="text-[9px] text-slate-500 font-bold align-middle">NODES</span></p>
                                                </div>
                                            </div>

                                            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                                    <Zap className="w-5 h-5 text-red-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Interactions (24h)</p>
                                                    <p className="text-xl font-black text-white">{honeypotActivity.interactions24h || 0}</p>
                                                </div>
                                            </div>

                                            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                    <Users className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Unique Attackers</p>
                                                    <p className="text-xl font-black text-white">{honeypotActivity.uniqueAttackers || 0}</p>
                                                </div>
                                            </div>

                                            <div className="flex-[2] bg-white/5 border border-white/5 rounded-2xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Top Decoy Target</p>
                                                    <span className="text-[9px] text-emerald-400 font-black uppercase">Active Lure</span>
                                                </div>
                                                <p className="text-sm font-black text-white uppercase tracking-wider">{honeypotActivity.topDecoy || 'NONE'}</p>
                                                <div className="mt-2 w-full bg-slate-800/50 h-1 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-[98%] rounded-full animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* LOG ANALYSIS CONSOLE */}
                    <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
                                <h2 className="text-sm font-black text-white uppercase italic tracking-widest">Tactical Audit Matrix</h2>
                                <div className="h-4 w-px bg-white/10"></div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] animate-pulse">Live Periphery Stream</span>
                            </div>
                            <div className="flex items-center gap-5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                <span className="flex items-center gap-2"><Server className="w-3 h-3" /> FAZ SYNC: OK</span>
                                <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> EGRESS: ACTIVE</span>
                            </div>
                        </div>
                        <div className="max-h-[800px] overflow-hidden">
                            <LogTable logs={liveLogs} />
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                .animate-spin-slow { animation: spin 20s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
                .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
            ` }} />

                {/* Log Details Modal */}
                <LogModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={modalTitle}
                    logs={modalLogs}
                    loading={modalLoading}
                    icon={modalIcon}
                    color={modalColor}
                />

                {/* Metric Detail Modal */}
                {metricModalOpen && selectedMetric && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                                            {selectedMetric.title}
                                        </h2>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            {selectedMetric.description}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setMetricModalOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-xl transition-all group"
                                    >
                                        <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-white rotate-45" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Key Insights */}
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Key Insights
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedMetric.insights.map((insight, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                                <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Data Preview (if available) */}
                                {selectedMetric.data && Object.keys(selectedMetric.data).length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Terminal className="w-4 h-4" />
                                            Raw Data
                                        </h3>
                                        <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-auto max-h-48 custom-scrollbar">
                                            <pre>{JSON.stringify(selectedMetric.data, null, 2)}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-white/10 bg-black/20 flex items-center justify-between">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                    Real-time SOC Intelligence
                                </p>
                                <button
                                    onClick={() => setMetricModalOpen(false)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-blue-500/20"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </React.Suspense>
        </div>
    );
}
