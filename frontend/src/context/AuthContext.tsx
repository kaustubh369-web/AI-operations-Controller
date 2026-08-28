import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AuthApi } from '../api/endpoints';
import type { AuthResponse, Role } from '../types';

interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: { fullName: string; email: string; password: string; hostelBlock?: string; floor?: string; room?: string; phone?: string }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persist(res: AuthResponse): AuthUser {
  const user: AuthUser = { userId: res.userId, fullName: res.fullName, email: res.email, role: res.role };
  localStorage.setItem('lifeline_token', res.token);
  localStorage.setItem('lifeline_user', JSON.stringify(user));
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('lifeline_user');
    const token = localStorage.getItem('lifeline_token');
    if (raw && token) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore corrupt storage */ }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await AuthApi.login(email, password);
    const u = persist(res);
    setUser(u);
    return u;
  };

  const register = async (payload: { fullName: string; email: string; password: string; hostelBlock?: string; floor?: string; room?: string; phone?: string }) => {
    const res = await AuthApi.register(payload);
    const u = persist(res);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('lifeline_token');
    localStorage.removeItem('lifeline_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
