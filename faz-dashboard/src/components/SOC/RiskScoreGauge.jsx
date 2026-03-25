import React from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const RiskScoreGauge = ({ score, level }) => {
    const getColor = () => {
        if (level === 'low') return { bg: 'from-emerald-500 to-green-600', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' };
        if (level === 'medium') return { bg: 'from-amber-500 to-orange-600', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]' };
        return { bg: 'from-red-500 to-rose-600', text: 'text-red-400', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' };
    };

    const colors = getColor();
    const rotation = (score / 100) * 180 - 90;

    return (
        <div className="relative w-full h-32 flex items-center justify-center">
            {/* Gauge Background */}
            <svg className="absolute w-full h-full" viewBox="0 0 200 120">
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#riskGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 251} 251`}
                    className="transition-all duration-1000"
                />
                <defs>
                    <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" className={colors.bg.includes('emerald') ? 'stop-emerald-500' : colors.bg.includes('amber') ? 'stop-amber-500' : 'stop-red-500'} />
                        <stop offset="100%" className={colors.bg.includes('green') ? 'stop-green-600' : colors.bg.includes('orange') ? 'stop-orange-600' : 'stop-rose-600'} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Center Display */}
            <div className="absolute flex flex-col items-center justify-center">
                <div className={`text-4xl font-black ${colors.text} italic tracking-tighter ${colors.glow}`}>
                    {score}
                </div>
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-[0.3em] mt-1">
                    RISK SCORE
                </div>
            </div>
        </div>
    );
};

export default RiskScoreGauge;
