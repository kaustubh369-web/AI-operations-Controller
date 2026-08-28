import { Check } from 'lucide-react';
import type { ComplaintStatus } from '../types';
import { STATUS_FLOW, STATUS_LABELS } from '../lib/format';

export default function StatusTimeline({ status }: { status: ComplaintStatus }) {
  if (status === 'ESCALATED') {
    return (
      <div className="flex items-center gap-2 text-rose-400 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" /> Escalated for senior review
      </div>
    );
  }
  if (status === 'ACTION_REJECTED') {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-amber-400" /> Action rejected — warden reviewing alternatives
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(status);

  return (
    <div className="flex items-center w-full overflow-x-auto pb-1">
      {STATUS_FLOW.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1.5 w-24">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition
                  ${done ? 'bg-accent-500 border-accent-500 text-navy-950' : ''}
                  ${active ? 'border-accent-400 text-accent-400 bg-accent-400/10 shadow-glow' : ''}
                  ${!done && !active ? 'border-navy-600 text-slate-600' : ''}`}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-[10px] text-center leading-tight font-mono uppercase tracking-tight
                ${active ? 'text-accent-400' : done ? 'text-slate-300' : 'text-slate-600'}`}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`h-0.5 w-8 -mt-5 shrink-0 ${done ? 'bg-accent-500' : 'bg-navy-600'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
