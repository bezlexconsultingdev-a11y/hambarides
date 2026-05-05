import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

const ADMIN_NOTIFICATIONS_API_KEY = import.meta.env.VITE_ADMIN_NOTIFICATIONS_API_KEY || '';

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    const legacy = localStorage.getItem('admin_token');
    if (legacy) config.headers.Authorization = `Bearer ${legacy}`;
  }
  if (ADMIN_NOTIFICATIONS_API_KEY) {
    (config.headers as Record<string, string>)['x-admin-api-key'] = ADMIN_NOTIFICATIONS_API_KEY;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
