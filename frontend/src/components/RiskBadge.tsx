import type { RiskLevel } from '../types';
import { RISK_COLORS } from '../lib/format';

export default function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide px-2.5 py-1 rounded-full border ${RISK_COLORS[level]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level}{typeof score === 'number' ? ` · ${score}` : ''}
    </span>
  );
}
