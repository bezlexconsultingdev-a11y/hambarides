import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AdminUser } from '../api/auth';
import { getMe } from '../api/auth';

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string, user: AdminUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((token: string, u: AdminUser) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { login: apiLogin } = await import('../api/auth');
    const { token, user: u } = await apiLogin(email, password);
    setToken(token, u);
  }, [setToken]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const saved = localStorage.getItem('admin_user');
    if (!token) {
      setLoading(false);
      return;
    }
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    getMe()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
