import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Gauge, ListChecks, Search } from 'lucide-react';

const STEPS = [
  { label: 'Reading complaint & context', icon: Search },
  { label: 'Identifying probable root cause', icon: Brain },
  { label: 'Calculating risk score', icon: Gauge },
  { label: 'Ranking recovery actions', icon: ListChecks },
];

export default function AiProcessingAnimation({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 550);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <div className="glass-card p-8 flex flex-col items-center text-center">
      <div className="relative w-16 h-16 mb-5">
        <div className="absolute inset-0 rounded-full border-2 border-accent-500/20" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain size={22} className="text-accent-400" />
        </div>
      </div>
      <p className="font-semibold text-slate-100 mb-1">LifeLine AI is analyzing your report</p>
      <p className="text-sm text-slate-500 mb-6">This takes a few seconds — deterministic, explainable, no black box.</p>

      <div className="space-y-2.5 w-full max-w-xs">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <AnimatePresence key={s.label} mode="wait">
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: done || active ? 1 : 0.35, x: 0 }}
                className="flex items-center gap-3 text-left"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                  ${done ? 'bg-emerald-400/10 text-emerald-400' : active ? 'bg-accent-400/10 text-accent-400' : 'bg-navy-700 text-slate-600'}`}>
                  <Icon size={14} />
                </div>
                <span className={`text-sm ${done ? 'text-slate-400' : active ? 'text-slate-100 font-medium' : 'text-slate-600'}`}>
                  {s.label}{active ? '…' : done ? ' ✓' : ''}
                </span>
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
}
