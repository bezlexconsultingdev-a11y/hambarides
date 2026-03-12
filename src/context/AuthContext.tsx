import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { AdminUser } from '../api/auth';
import { getMe } from '../api/auth';

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { login: apiLogin } = await import('../api/auth');
    const { user: u } = await apiLogin(email, password);
    setUser(u);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Dev only: skip login and use a mock admin (set VITE_DEV_SKIP_LOGIN=true in .env)
      if (import.meta.env.DEV && import.meta.env.VITE_DEV_SKIP_LOGIN === 'true') {
        setUser({
          id: 'dev-admin',
          email: 'admin@test.co.za',
          first_name: 'Hamba',
          last_name: 'Rides',
          user_type: 'admin',
        });
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) {
        setLoading(false);
        return;
      }
      getMe()
        .then((u) => { if (!cancelled) setUser(u); })
        .catch(() => { if (!cancelled) setUser(null); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
