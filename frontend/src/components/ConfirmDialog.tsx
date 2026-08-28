import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="glass-card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-rose-400/10 text-rose-400' : 'bg-accent-400/10 text-accent-400'}`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">{title}</h3>
                <p className="text-sm text-slate-400 mt-1">{description}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={onCancel}>Cancel</button>
              <button
                className={danger ? 'bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-lg transition' : 'btn-primary'}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
