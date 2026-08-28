import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', hostelBlock: '', floor: '', room: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      push('Account created — welcome to LifeLine.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent-500/10 flex items-center justify-center mb-3">
            <Activity size={24} className="text-accent-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-50">Create a student account</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="label-sm">Full name</label>
            <input className="input-field" required value={form.fullName} onChange={set('fullName')} placeholder="Asha Verma" />
          </div>
          <div>
            <label className="label-sm">Email</label>
            <input className="input-field" type="email" required value={form.email} onChange={set('email')} placeholder="you@hostel.edu" />
          </div>
          <div>
            <label className="label-sm">Password</label>
            <input className="input-field" type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-sm">Block</label>
              <input className="input-field" value={form.hostelBlock} onChange={set('hostelBlock')} placeholder="Block A" />
            </div>
            <div>
              <label className="label-sm">Floor</label>
              <input className="input-field" value={form.floor} onChange={set('floor')} placeholder="2nd" />
            </div>
            <div>
              <label className="label-sm">Room</label>
              <input className="input-field" value={form.room} onChange={set('room')} placeholder="A-214" />
            </div>
          </div>
          <div>
            <label className="label-sm">Phone (optional)</label>
            <input className="input-field" value={form.phone} onChange={set('phone')} placeholder="+91 90000 00000" />
          </div>
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
            <UserPlus size={16} /> {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account? <Link to="/login" className="text-accent-400 hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
