import { supabase } from '../lib/supabase';

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

export async function login(email: string, password: string): Promise<{ user: AdminUser }> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Login failed');

  // Try by id (UUID schema: public.users.id = auth.users.id)
  let profile: { id: string; email?: string; first_name?: string; last_name?: string; user_type?: string } | null = null;
  let lastError: { code?: string; message?: string } | null = null;

  const byId = await supabase
    .from('users')
    .select('id, email, first_name, last_name, user_type')
    .eq('id', authData.user.id)
    .maybeSingle();
  lastError = byId.error;
  profile = byId.data;

  // If no row by id, try by auth_id (schema where users.id is serial and auth_id = auth.users.id)
  if (!profile) {
    const byAuthId = await supabase
      .from('users')
      .select('id, email, first_name, last_name, user_type')
      .eq('auth_id', authData.user.id)
      .maybeSingle();
    lastError = byAuthId.error;
    profile = byAuthId.data;
  }

  if (lastError) {
    throw new Error(`Profile error (${lastError.code ?? 'unknown'}): ${lastError.message ?? ''}`);
  }
  if (!profile) {
    const hint =
      'Run supabase/CREATE_ADMIN_USER.sql: 1) Create user in Auth (admin@test.co.za / Admin123!), 2) Run the INSERT in SQL Editor. ' +
      'Ensure RLS allows "Users can view their own profile" (id = auth.uid() or auth_id = auth.uid()).';
    throw new Error(`No admin profile found. ${hint}`);
  }
  if (profile.user_type !== 'admin') {
    await supabase.auth.signOut();
    throw new Error('Access denied. Admin only.');
  }

  const user: AdminUser = {
    id: String(profile.id),
    email: profile.email ?? '',
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    user_type: profile.user_type ?? 'admin',
  };
  return { user };
}

export async function getMe(): Promise<AdminUser> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Not signed in');

  let res = await supabase
    .from('users')
    .select('id, email, first_name, last_name, user_type')
    .eq('id', authUser.id)
    .maybeSingle();
  if (!res.data) {
    res = await supabase
      .from('users')
      .select('id, email, first_name, last_name, user_type')
      .eq('auth_id', authUser.id)
      .maybeSingle();
  }
  const profile = res.data;
  if (res.error) throw new Error(`Could not load profile: ${res.error.message}`);
  if (!profile) throw new Error('Could not load user profile');
  if (profile.user_type !== 'admin') throw new Error('Access denied. Admin only.');

  return {
    id: String(profile.id),
    email: profile.email ?? '',
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    user_type: profile.user_type ?? 'admin',
  };
}
