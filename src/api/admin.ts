import { supabase } from '../lib/supabase';
import { api } from './client';

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
  const { data } = await api.get('/admin/dashboard');
  return data as { stats: DashboardStats };
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
  const { data } = await api.get('/admin/drivers/applications/pending', {
    params: { limit: params?.limit ?? 100 },
  });
  return data as { applications: DriverApplicationRow[] };
}

export async function approveApplication(id: number): Promise<{ application: DriverApplicationRow }> {
  const { data } = await api.post(`/admin/drivers/applications/${id}/approve`);
  return data as { application: DriverApplicationRow };
}

export async function declineApplication(id: number, reason?: string): Promise<{ application: DriverApplicationRow }> {
  const { data } = await api.post(`/admin/drivers/applications/${id}/decline`, { reason });
  return data as { application: DriverApplicationRow };
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
  const { data } = await api.get('/admin/sos/events', {
    params: { limit: params?.limit ?? 100 },
  });
  return data as { events: SosEventRow[] };
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
