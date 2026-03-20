import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalUsers: number;
  totalRiders: number;
  totalDrivers: number;
  totalRides: number;
  completedRides: number;
  pendingRides: number;
  totalRevenue: number;
  totalCommission?: number;
  totalCommissionOwed?: number;
  totalToPayout: number;
}

export async function getDashboard(): Promise<{ stats: DashboardStats }> {
  const [
    usersRes,
    driversRes,
    ridesRes,
    completedRes,
    pendingRes,
    receiptsRes,
  ] = await Promise.all([
    supabase.from('users').select('id, user_type', { count: 'exact', head: true }),
    supabase.from('drivers').select('id', { count: 'exact', head: true }),
    supabase.from('rides').select('id', { count: 'exact', head: true }),
    supabase.from('rides').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('rides').select('id', { count: 'exact', head: true }).in('status', ['pending', 'requested', 'searching', 'accepted']),
    supabase.from('receipts').select('fare_amount'),
  ]);

  const totalUsers = usersRes.count ?? 0;
  const totalDrivers = driversRes.count ?? 0;
  const totalRides = ridesRes.count ?? 0;
  const completedRides = completedRes.count ?? 0;
  const pendingRides = pendingRes.count ?? 0;

  const receipts = receiptsRes.data ?? [];
  const totalRevenue = receipts.reduce((sum, r) => sum + Number(r.fare_amount ?? 0), 0);
  const totalCommission = totalRevenue * 0.21;
  const totalToPayout = receipts.reduce((sum, r) => sum + Number(r.fare_amount ?? 0) * 0.79, 0);

  const riderCountRes = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_type', 'rider');
  const totalRiders = riderCountRes.count ?? 0;

  const stats: DashboardStats = {
    totalUsers,
    totalRiders,
    totalDrivers,
    totalRides,
    completedRides,
    pendingRides,
    totalRevenue,
    totalCommission,
    totalCommissionOwed: 0,
    totalToPayout,
  };
  return { stats };
}

export interface UserRow {
  id: string | number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export async function getUsers(params?: { limit?: number; offset?: number; user_type?: string }): Promise<{ users: UserRow[] }> {
  let q = supabase
    .from('users')
    .select('id, email, phone, first_name, last_name, user_type, is_verified, is_active, created_at')
    .order('created_at', { ascending: false })
    .range(params?.offset ?? 0, (params?.offset ?? 0) + (params?.limit ?? 100) - 1);
  if (params?.user_type) q = q.eq('user_type', params.user_type);
  const { data } = await q;
  const users = (data ?? []).map((r) => ({
    id: r.id,
    email: r.email ?? '',
    phone: r.phone ?? '',
    first_name: r.first_name ?? '',
    last_name: r.last_name ?? '',
    user_type: r.user_type ?? '',
    is_verified: Boolean(r.is_verified),
    is_active: r.is_active !== false,
    created_at: r.created_at ?? '',
  }));
  return { users };
}

export interface DriverRow {
  id: number | string;
  user_id: number | string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate_number: string;
  is_available: boolean;
  rating: number;
  total_rides: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export async function getDrivers(params?: { limit?: number; offset?: number }): Promise<{ drivers: DriverRow[] }> {
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  const { data: driversData } = await supabase
    .from('drivers')
    .select('id, user_id, license_number, vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate_number, is_available, rating, total_rides, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const list = driversData ?? [];
  const userIds = [...new Set(list.map((d) => d.user_id).filter(Boolean))] as string[];
  const userMap: Record<string, { first_name?: string; last_name?: string; phone?: string; email?: string }> = {};
  if (userIds.length > 0) {
    const { data: usersData } = await supabase.from('users').select('id, first_name, last_name, phone, email').in('id', userIds);
    (usersData ?? []).forEach((u) => { userMap[u.id] = u; });
  }

  const drivers: DriverRow[] = list.map((d) => {
    const u = userMap[d.user_id as string] ?? {};
    return {
      id: d.id,
      user_id: d.user_id,
      license_number: String(d.license_number ?? ''),
      vehicle_make: String(d.vehicle_make ?? ''),
      vehicle_model: String(d.vehicle_model ?? ''),
      vehicle_year: Number(d.vehicle_year ?? 0),
      vehicle_color: String(d.vehicle_color ?? ''),
      vehicle_plate_number: String(d.vehicle_plate_number ?? ''),
      is_available: Boolean(d.is_available),
      rating: Number(d.rating ?? 0),
      total_rides: Number(d.total_rides ?? 0),
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone,
      email: u.email,
      created_at: String(d.created_at ?? ''),
    };
  });
  return { drivers };
}

export interface DriverApplicationRow {
  id: number;
  driver_id: number;
  user_id: number | string;
  email: string;
  full_name: string;
  country_of_birth: string;
  address: string;
  id_document_url: string;
  selfie_url: string;
  police_clearance_url: string;
  police_clearance_issue_date: string;
  vehicle_photos_urls: string;
  drivers_license_url: string;
  license_expiry_date?: string | null;
  prdp_url?: string | null;
  commercial_insurance_url?: string | null;
  status: string;
  submitted_at: string;
}

export async function getPendingApplications(params?: { limit?: number }): Promise<{ applications: DriverApplicationRow[] }> {
  const limit = params?.limit ?? 100;
  const { data: appData } = await supabase
    .from('driver_applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);

  const list = appData ?? [];
  const driverIds = [...new Set(list.map((a) => a.driver_id).filter(Boolean))];
  const driverMap: Record<string, { user_id: string }> = {};
  if (driverIds.length > 0) {
    const { data: drData } = await supabase.from('drivers').select('id, user_id').in('id', driverIds);
    (drData ?? []).forEach((d) => { driverMap[String(d.id)] = { user_id: d.user_id as string }; });
  }
  const userIds = [...new Set(Object.values(driverMap).map((d) => d.user_id))];
  const userMap: Record<string, { first_name?: string; last_name?: string; email?: string }> = {};
  if (userIds.length > 0) {
    const { data: uData } = await supabase.from('users').select('id, first_name, last_name, email').in('id', userIds);
    (uData ?? []).forEach((u) => { userMap[u.id] = u; });
  }

  const applications: DriverApplicationRow[] = list.map((a) => {
    const dr = driverMap[String(a.driver_id)] ?? {};
    const u = userMap[dr.user_id] ?? {};
    const email = (a.email as string) ?? u.email ?? '';
    const fullName = (a.full_name as string) ?? ([u.first_name, u.last_name].filter(Boolean).join(' ') || email);
    return {
      id: Number(a.id),
      driver_id: Number(a.driver_id),
      user_id: dr.user_id ?? '',
      email,
      full_name: fullName,
      country_of_birth: String(a.country_of_birth ?? ''),
      address: String(a.address ?? ''),
      id_document_url: String(a.id_document_url ?? ''),
      selfie_url: String(a.selfie_url ?? ''),
      police_clearance_url: String(a.police_clearance_url ?? ''),
      police_clearance_issue_date: String(a.police_clearance_issue_date ?? ''),
      vehicle_photos_urls: String(a.vehicle_photos_urls ?? ''),
      drivers_license_url: String(a.drivers_license_url ?? ''),
      license_expiry_date: a.license_expiry_date ?? null,
      prdp_url: a.prdp_url ?? null,
      commercial_insurance_url: a.commercial_insurance_url ?? null,
      status: String(a.status ?? 'pending'),
      submitted_at: String(a.created_at ?? ''),
    };
  });
  return { applications };
}

export async function approveApplication(id: number): Promise<{ application: DriverApplicationRow }> {
  // 1. Get the application to find the driver_id and selfie_url
  const { data: app, error: fetchErr } = await supabase
    .from('driver_applications')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !app) throw fetchErr || new Error('Application not found');

  // 2. Update application status
  const { error } = await supabase
    .from('driver_applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;

  // 3. Update driver's verification_status to 'approved' + set profile photo from selfie
  const { error: driverErr } = await supabase
    .from('drivers')
    .update({
      verification_status: 'approved',
      profile_photo_url: app.selfie_url || null,
    })
    .eq('id', app.driver_id);
  if (driverErr) console.error('Failed to update driver status:', driverErr);

  // 4. Try to send approval email via backend (if running)
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await fetch(`${backendUrl}/api/admin/drivers/applications/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {}); // silent fail if backend not reachable
  } catch {}

  const { data: updated } = await supabase.from('driver_applications').select('*').eq('id', id).single();
  return { application: updated as unknown as DriverApplicationRow };
}

export async function declineApplication(id: number, reason?: string): Promise<{ application: DriverApplicationRow }> {
  // 1. Get the application to find the driver_id
  const { data: app, error: fetchErr } = await supabase
    .from('driver_applications')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !app) throw fetchErr || new Error('Application not found');

  // 2. Update application status + decline reason
  const { error } = await supabase
    .from('driver_applications')
    .update({
      status: 'declined',
      decline_reason: reason || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;

  // 3. Update driver's verification_status to 'declined'
  const { error: driverErr } = await supabase
    .from('drivers')
    .update({ verification_status: 'declined' })
    .eq('id', app.driver_id);
  if (driverErr) console.error('Failed to update driver status:', driverErr);

  // 4. Try to send denial email via backend (if running)
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await fetch(`${backendUrl}/api/admin/drivers/applications/${id}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }).catch(() => {});
  } catch {}

  const { data: updated } = await supabase.from('driver_applications').select('*').eq('id', id).single();
  return { application: updated as unknown as DriverApplicationRow };
}

export interface RideRow {
  id: number | string;
  rider_id: number | string;
  driver_id: number | string | null;
  ride_type: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  fare_amount: number | null;
  distance_km: number | null;
  requested_at: string;
  completed_at: string | null;
}

export async function getRides(params?: { limit?: number; offset?: number; status?: string }): Promise<{ rides: RideRow[] }> {
  const limit = params?.limit ?? 500;
  const offset = params?.offset ?? 0;
  let q = supabase
    .from('rides')
    .select('id, rider_id, driver_id, ride_type, pickup_address, dropoff_address, status, fare_amount, distance_km, requested_at, completed_at')
    .order('requested_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (params?.status) q = q.eq('status', params.status);
  const { data } = await q;
  return { rides: (data ?? []) as RideRow[] };
}

export interface PayoutDriverRow {
  driver_id: number | string;
  user_id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  completed_rides: number;
  total_earned: number;
}

export interface PayoutsResponse {
  totalToPayout: number;
  drivers: PayoutDriverRow[];
  totalCommissionOwed?: number;
  totalPlatformRevenue?: number;
}

export async function getPayouts(): Promise<PayoutsResponse> {
  const { data: receipts } = await supabase.from('receipts').select('driver_id, fare_amount');
  const driverEarns: Record<string, { completed_rides: number; total_earned: number }> = {};
  let totalToPayout = 0;
  let totalPlatformRevenue = 0;
  (receipts ?? []).forEach((r) => {
    const did = String(r.driver_id);
    if (!driverEarns[did]) driverEarns[did] = { completed_rides: 0, total_earned: 0 };
    const fare = Number(r.fare_amount ?? 0);
    driverEarns[did].completed_rides += 1;
    driverEarns[did].total_earned += fare * 0.79;
    totalToPayout += fare * 0.79;
    totalPlatformRevenue += fare * 0.21;
  });

  const driverUserIds = Object.keys(driverEarns);
  if (driverUserIds.length === 0) return { totalToPayout: 0, drivers: [], totalPlatformRevenue, totalCommissionOwed: 0 };

  const { data: usersData } = await supabase.from('users').select('id, first_name, last_name, email').in('id', driverUserIds);
  const driversList: PayoutDriverRow[] = (usersData ?? []).map((u) => {
    const earns = driverEarns[String(u.id)] ?? { completed_rides: 0, total_earned: 0 };
    return {
      driver_id: u.id,
      user_id: u.id,
      first_name: u.first_name ?? '',
      last_name: u.last_name ?? '',
      email: u.email ?? '',
      completed_rides: earns.completed_rides,
      total_earned: earns.total_earned,
    };
  });

  return {
    totalToPayout,
    drivers: driversList,
    totalPlatformRevenue,
    totalCommissionOwed: 0,
  };
}

export interface SosEventRow {
  id: number | string;
  ride_id: number | string | null;
  user_id: number | string;
  latitude: number | null;
  longitude: number | null;
  emergency_phone: string;
  created_at: string;
}

export async function getSosEvents(params?: { limit?: number }): Promise<{ events: SosEventRow[] }> {
  const limit = params?.limit ?? 100;
  const { data } = await supabase
    .from('sos_events')
    .select('id, ride_id, user_id, latitude, longitude, emergency_phone, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { events: (data ?? []) as SosEventRow[] };
}

// Receipts (admin RLS allows)
export interface ReceiptRow {
  id: number | string;
  ride_id: number | string;
  rider_id: number | string;
  driver_id: number | string;
  fare_amount: number;
  payment_method: string | null;
  created_at: string;
}

export async function getReceipts(params?: { limit?: number }): Promise<{ receipts: ReceiptRow[] }> {
  const limit = params?.limit ?? 100;
  const { data } = await supabase
    .from('receipts')
    .select('id, ride_id, rider_id, driver_id, fare_amount, payment_method, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { receipts: (data ?? []) as ReceiptRow[] };
}

// Trip logs (admin RLS allows via ride_id -> rides)
export interface TripLogRow {
  id: number | string;
  ride_id: number | string;
  driver_id: number | string;
  rider_id: number | string;
  pickup_address: string;
  dropoff_address: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export async function getTripLogs(params?: { limit?: number }): Promise<{ trip_logs: TripLogRow[] }> {
  const limit = params?.limit ?? 100;
  const { data } = await supabase
    .from('trip_logs')
    .select('id, ride_id, pickup_address, dropoff_address, started_at, completed_at, created_at, rides(rider_id, driver_id)')
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as Array<Record<string, unknown> & { rides?: { rider_id?: string; driver_id?: string } | null }>;
  const trip_logs: TripLogRow[] = rows.map((r) => ({
    id: r.id as string | number,
    ride_id: r.ride_id as string | number,
    driver_id: (r.rides?.driver_id ?? '') as string | number,
    rider_id: (r.rides?.rider_id ?? '') as string | number,
    pickup_address: String(r.pickup_address ?? ''),
    dropoff_address: String(r.dropoff_address ?? ''),
    started_at: (r.started_at as string | null) ?? null,
    completed_at: (r.completed_at as string | null) ?? null,
    created_at: String(r.created_at ?? ''),
  }));
  return { trip_logs };
}
