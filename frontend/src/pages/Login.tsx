import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const DEMO_ACCOUNTS = [
  { label: 'Student', email: 'student@lifeline.demo' },
  { label: 'Warden', email: 'warden@lifeline.demo' },
  { label: 'Admin', email: 'admin@lifeline.demo' },
];
const DEMO_PASSWORD = 'Lifeline@123';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      push(`Welcome back, ${user.fullName.split(' ')[0]}.`, 'success');
      navigate(user.role === 'STUDENT' ? '/dashboard' : '/ops');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-500/10 flex items-center justify-center mb-3">
            <Activity size={24} className="text-accent-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-50">LifeLine</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mt-1">by Cognora</p>
          <p className="text-sm text-slate-400 mt-3 text-center">Smarter Hostels. Safer Living.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="label-sm">Email</label>
            <input className="input-field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lifeline.demo" />
          </div>
          <div>
            <label className="label-sm">Password</label>
            <input className="input-field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
            <LogIn size={16} /> {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="glass-card p-4 mt-4">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">Demo accounts</p>
          <div className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-navy-900/60 hover:bg-navy-700/60 transition text-left"
                onClick={() => { setEmail(acc.email); setPassword(DEMO_PASSWORD); }}
              >
                <span className="text-slate-300">{acc.label}</span>
                <span className="font-mono text-xs text-slate-500">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          New student? <Link to="/register" className="text-accent-400 hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}
