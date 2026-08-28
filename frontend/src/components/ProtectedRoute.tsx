import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export default function ProtectedRoute({ children, allow }: { children: ReactNode; allow?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) {
    return <Navigate to={user.role === 'STUDENT' ? '/dashboard' : '/ops'} replace />;
  }
  return <>{children}</>;
}
