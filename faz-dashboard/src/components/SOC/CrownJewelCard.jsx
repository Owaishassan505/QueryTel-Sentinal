import React from 'react';
import { Server, AlertCircle, Shield, Activity } from 'lucide-react';

const CrownJewelCard = ({ asset }) => {
    const getExposureColor = (exposure) => {
        if (exposure === 'protected') return 'text-emerald-500 bg-emerald-500/10';
        if (exposure === 'monitored') return 'text-blue-500 bg-blue-500/10';
        return 'text-amber-500 bg-amber-500/10';
    };

    const getCriticalityIcon = (criticality) => {
        if (criticality === 'critical') return <AlertCircle className="w-3 h-3 text-red-500" />;
        if (criticality === 'high') return <Shield className="w-3 h-3 text-orange-500" />;
        return <Activity className="w-3 h-3 text-blue-500" />;
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer">
            <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-slate-800/50 border border-white/5">
                    <Server className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        {getCriticalityIcon(asset.criticality)}
                        <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">
                            {asset.name}
                        </p>
                    </div>
                    <p className="text-[8px] font-mono text-slate-500 font-bold">
                        {asset.ip}
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getExposureColor(asset.exposure)}`}>
                    {asset.exposure}
                </span>
                {asset.alerts > 0 && (
                    <span className="text-[8px] font-mono text-red-400 font-black">
                        {asset.alerts} alerts
                    </span>
                )}
            </div>
        </div>
    );
};

export default CrownJewelCard;
