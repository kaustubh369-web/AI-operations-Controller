import type { InfrastructureHealth } from '../types';
import { ASSET_STATUS_COLORS } from '../lib/format';

export default function HealthGauge({ asset }: { asset: InfrastructureHealth }) {
  const barColor =
    asset.healthPercent >= 85 ? 'bg-emerald-400' : asset.healthPercent >= 65 ? 'bg-amber-400' : 'bg-rose-400';

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-200">{asset.name}</span>
        <span className={`text-xs font-mono uppercase ${ASSET_STATUS_COLORS[asset.status]}`}>{asset.status}</span>
      </div>
      <div className="h-1.5 rounded-full bg-navy-900 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${asset.healthPercent}%` }} />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] text-slate-500">{asset.hostelBlock}</span>
        <span className="text-xs font-mono text-slate-400">{asset.healthPercent}%</span>
      </div>
    </div>
  );
}
