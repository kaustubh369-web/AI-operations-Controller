import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, Wifi, Snowflake, Droplets, ShowerHead, Construction, Flame, Camera, Zap, HelpCircle } from 'lucide-react';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import StatusTimeline from '../components/StatusTimeline';
import AiProcessingAnimation from '../components/AiProcessingAnimation';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { ComplaintApi } from '../api/endpoints';
import type { Complaint, ComplaintCategory } from '../types';
import { CATEGORY_LABELS, timeAgo } from '../lib/format';

const CATEGORY_ICONS: Record<ComplaintCategory, typeof Wifi> = {
  WIFI_INTERNET: Wifi, AC_COOLING: Snowflake, WATER_COOLER: Droplets, WASHROOM: ShowerHead,
  WALL_STRUCTURAL: Construction, FIRE_ALARM: Flame, CCTV_SECURITY: Camera, ELECTRICAL: Zap, OTHER: HelpCircle,
};

export default function StudentDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    ComplaintApi.list().then(setComplaints).finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">My Complaints</h1>
          <p className="text-sm text-slate-500 mt-1">Report an issue and track it through AI triage to resolution.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 shrink-0" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Report Issue
        </button>
      </div>

      {showForm && <ReportForm onClose={() => setShowForm(false)} onCreated={(c) => { setComplaints((p) => [c, ...p]); }} />}

      {loading ? (
        <div className="grid gap-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : complaints.length === 0 ? (
        <div className="glass-card">
          <EmptyState icon={HelpCircle} title="No reports yet" description="Anything to flag — Wi-Fi, AC, plumbing, safety? Report it and LifeLine's AI will triage it instantly." />
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const Icon = CATEGORY_ICONS[c.category];
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 cursor-pointer hover:border-accent-500/30 transition"
                onClick={() => navigate(`/complaints/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-navy-700/60 flex items-center justify-center shrink-0 text-accent-400">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-100 truncate">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{CATEGORY_LABELS[c.category]} · {c.hostelBlock} · {timeAgo(c.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.riskAssessment && <RiskBadge level={c.riskAssessment.riskLevel} />}
                    <ChevronRight size={18} className="text-slate-600" />
                  </div>
                </div>
                <StatusTimeline status={c.status} />
              </motion.div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

function ReportForm({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Complaint) => void }) {
  const [form, setForm] = useState({
    category: '' as ComplaintCategory | '', title: '', description: '', hostelBlock: '', floor: '', room: '',
  });
  const [phase, setPhase] = useState<'form' | 'analyzing' | 'done'>('form');
  const [created, setCreated] = useState<Complaint | null>(null);
  const { push } = useToast();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) return;
    setPhase('analyzing');
    try {
      const res = await ComplaintApi.submit({ ...form, category: form.category as ComplaintCategory });
      setCreated(res);
    } catch (err: any) {
      push(err?.response?.data?.message || 'Could not submit complaint', 'error');
      setPhase('form');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 overflow-hidden">
      {phase === 'form' && (
        <form onSubmit={submit} className="glass-card p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-sm">Category</label>
              <select className="input-field" required value={form.category} onChange={set('category')}>
                <option value="">Select a category</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label-sm">Title</label>
              <input className="input-field" required value={form.title} onChange={set('title')} placeholder="Short summary" />
            </div>
          </div>
          <div>
            <label className="label-sm">Description</label>
            <textarea className="input-field min-h-[90px]" required value={form.description} onChange={set('description')} placeholder="What's wrong, and since when?" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label-sm">Hostel block</label>
              <input className="input-field" required value={form.hostelBlock} onChange={set('hostelBlock')} placeholder="Block A" />
            </div>
            <div>
              <label className="label-sm">Floor</label>
              <input className="input-field" value={form.floor} onChange={set('floor')} placeholder="2nd Floor" />
            </div>
            <div>
              <label className="label-sm">Room</label>
              <input className="input-field" value={form.room} onChange={set('room')} placeholder="A-214" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Submit report</button>
          </div>
        </form>
      )}

      {phase === 'analyzing' && (
        <AiProcessingAnimation onDone={() => { if (created) { setPhase('done'); onCreated(created); push('Complaint analyzed and routed.', 'success'); } }} />
      )}

      {phase === 'done' && created && (
        <div className="glass-card p-6 text-center">
          <p className="font-semibold text-slate-100 mb-1">Reported and analyzed ✓</p>
          <p className="text-sm text-slate-400 mb-4">{created.riskAssessment?.probableRootCause}</p>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      )}
    </motion.div>
  );
}
