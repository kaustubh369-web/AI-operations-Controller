import type { LucideIcon } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-navy-700/60 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>
      <p className="text-slate-300 font-medium">{title}</p>
      {description && <p className="text-slate-500 text-sm mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
