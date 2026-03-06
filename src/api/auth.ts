import { api } from './client';

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

export async function login(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
  const { data } = await api.post<{ token: string; user: AdminUser }>('/auth/login', { email, password });
  if (data.user?.user_type !== 'admin') {
    throw new Error('Access denied. Admin only.');
  }
  return { token: data.token, user: data.user };
}

export async function getMe(): Promise<AdminUser> {
  const { data } = await api.get<{ user: AdminUser }>('/auth/me');
  return data.user;
}
