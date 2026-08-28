import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileWarning, ShieldAlert, BarChart3, ScrollText, Siren,
  Menu, X, LogOut, Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; }

const studentNav: NavItem[] = [
  { to: '/dashboard', label: 'My Complaints', icon: FileWarning },
];

const wardenNav: NavItem[] = [
  { to: '/ops', label: 'Operations Center', icon: LayoutDashboard },
  { to: '/incidents', label: 'Active Incidents', icon: FileWarning },
  { to: '/approvals', label: 'Approvals', icon: ShieldAlert },
  { to: '/emergency', label: 'Emergency Monitor', icon: Siren },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/audit', label: 'Audit Trail', icon: ScrollText },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = user?.role === 'STUDENT' ? studentNav : wardenNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-navy-700 bg-navy-900/60 backdrop-blur-sm">
        <SidebarContent nav={nav} user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-navy-900/90 backdrop-blur-sm border-b border-navy-700">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-accent-400" />
          <span className="font-bold tracking-tight">LifeLine</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-300"><Menu size={22} /></button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-navy-900 border-r border-navy-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-400"><X size={20} /></button>
            </div>
            <SidebarContent nav={nav} user={user} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarContent({
  nav, user, onLogout, onNavigate,
}: {
  nav: NavItem[];
  user: { fullName: string; role: string } | null;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full py-6 px-4">
      <div className="flex items-center gap-2 px-2 mb-1">
        <Activity size={22} className="text-accent-400" />
        <span className="text-lg font-bold tracking-tight text-slate-50">LifeLine</span>
      </div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 px-2 mb-8">by Cognora</p>

      <nav className="flex-1 space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
               ${isActive ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/50 border border-transparent'}`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-navy-700 pt-4 mt-4">
        <div className="px-2 mb-3">
          <p className="text-sm font-medium text-slate-200 truncate">{user?.fullName}</p>
          <p className="text-[11px] font-mono uppercase text-accent-400/80">{user?.role}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}
