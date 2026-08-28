import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatCard({
  label, value, icon: Icon, accent = 'accent', suffix,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'accent' | 'rose' | 'amber' | 'emerald';
  suffix?: string;
}) {
  const accentClasses: Record<string, string> = {
    accent: 'text-accent-400 bg-accent-400/10',
    rose: 'text-rose-400 bg-rose-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex items-center justify-between"
    >
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">{label}</p>
        <p className="text-2xl font-bold text-slate-50">
          {value}{suffix && <span className="text-sm font-normal text-slate-400 ml-1">{suffix}</span>}
        </p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentClasses[accent]}`}>
        <Icon size={20} />
      </div>
    </motion.div>
  );
}
