import { api } from './client';

export interface DashboardStats {
  totalUsers: number;
  totalRiders: number;
  totalDrivers: number;
  /** Drivers with verification_status = approved */
  approvedDrivers?: number;
  /** driver_applications awaiting review */
  pendingApplications?: number;
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
  const search = new URLSearchParams();
  search.set('limit', String(params?.limit ?? 100));
  search.set('offset', String(params?.offset ?? 0));
  if (params?.user_type) search.set('user_type', params.user_type);
  const { data } = await api.get(`/admin/users?${search.toString()}`);
  const users = (data?.users ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string | number,
    email: String(r.email ?? ''),
    phone: String(r.phone ?? ''),
    first_name: String(r.first_name ?? ''),
    last_name: String(r.last_name ?? ''),
    user_type: String(r.user_type ?? ''),
    is_verified: Boolean(r.is_verified),
    is_active: r.is_active !== false,
    created_at: String(r.created_at ?? ''),
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
  application_status?: string | null;
  license_expiry_date?: string | null;
  application?: DriverManagementApplication | null;
  banking?: DriverBankingDetails | null;
}

export interface DriverBankingDetails {
  driver_id: number | string;
  bank_name?: string | null;
  account_holder_name?: string | null;
  account_number?: string | null;
  account_type?: string | null;
  branch_code?: string | null;
  verified?: boolean;
}

export interface DriverManagementApplication {
  id: number;
  driver_id: number | string;
  full_name?: string | null;
  country_of_birth?: string | null;
  address?: string | null;
  id_document_url?: string | null;
  selfie_url?: string | null;
  police_clearance_url?: string | null;
  police_clearance_issue_date?: string | null;
  vehicle_photos_urls?: string | null;
  drivers_license_url?: string | null;
  license_expiry_date?: string | null;
  prdp_url?: string | null;
  commercial_insurance_url?: string | null;
  signed_contract_url?: string | null;
  status?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
}

export async function getDrivers(params?: { limit?: number; offset?: number }): Promise<{ drivers: DriverRow[] }> {
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  const search = new URLSearchParams();
  search.set('limit', String(limit));
  search.set('offset', String(offset));
  const { data } = await api.get(`/admin/drivers?${search.toString()}`);
  const list = (data?.drivers ?? []) as Record<string, unknown>[];
  const drivers: DriverRow[] = list.map((d) => ({
    id: d.id as number | string,
    user_id: d.user_id as number | string,
    license_number: String(d.license_number ?? ''),
    vehicle_make: String(d.vehicle_make ?? ''),
    vehicle_model: String(d.vehicle_model ?? ''),
    vehicle_year: Number(d.vehicle_year ?? 0),
    vehicle_color: String(d.vehicle_color ?? ''),
    vehicle_plate_number: String(d.vehicle_plate_number ?? ''),
    is_available: Boolean(d.is_available),
    rating: Number(d.rating ?? 0),
    total_rides: Number(d.total_rides ?? 0),
    first_name: d.first_name != null ? String(d.first_name) : undefined,
    last_name: d.last_name != null ? String(d.last_name) : undefined,
    phone: d.phone != null ? String(d.phone) : undefined,
    email: d.email != null ? String(d.email) : undefined,
    created_at: String(d.created_at ?? ''),
    application_status: d.application_status != null ? String(d.application_status) : null,
    license_expiry_date: d.license_expiry_date != null ? String(d.license_expiry_date) : null,
    application: (d.application as DriverManagementApplication | null | undefined) ?? null,
    banking: (d.banking as DriverBankingDetails | null | undefined) ?? null,
  }));
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
  signed_contract_url?: string | null;
  bank_name?: string | null;
  account_holder_name?: string | null;
  account_number?: string | null;
  account_type?: string | null;
  branch_code?: string | null;
  banking_verified?: boolean;
  status: string;
  submitted_at: string;
}

export async function getPendingApplications(params?: { limit?: number }): Promise<{ applications: DriverApplicationRow[] }> {
  const { data } = await api.get('/admin/drivers/applications/pending', {
    params: { limit: params?.limit ?? 100 },
  });
  return data as { applications: DriverApplicationRow[] };
}

export async function approveApplication(id: number): Promise<{
  application: DriverApplicationRow;
  emailSent?: boolean;
  emailError?: string | null;
}> {
  const { data } = await api.post(`/admin/drivers/applications/${id}/approve`);
  return data as {
    application: DriverApplicationRow;
    emailSent?: boolean;
    emailError?: string | null;
  };
}

export async function declineApplication(id: number, reason?: string): Promise<{
  application: DriverApplicationRow;
  emailSent?: boolean;
  emailError?: string | null;
}> {
  const { data } = await api.post(`/admin/drivers/applications/${id}/decline`, { reason });
  return data as {
    application: DriverApplicationRow;
    emailSent?: boolean;
    emailError?: string | null;
  };
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
  payment_method?: string | null;
  payment_status?: string | null;
  payment_reference?: string | null;
  rider_first_name?: string | null;
  rider_last_name?: string | null;
  rider_phone?: string | null;
  rider_email?: string | null;
}

export async function getRides(params?: { limit?: number; offset?: number; status?: string }): Promise<{ rides: RideRow[] }> {
  const limit = params?.limit ?? 500;
  const offset = params?.offset ?? 0;
  const search = new URLSearchParams();
  search.set('limit', String(limit));
  search.set('offset', String(offset));
  if (params?.status) search.set('status', params.status);
  const { data } = await api.get(`/admin/rides?${search.toString()}`);
  return { rides: (data?.rides ?? []) as RideRow[] };
}

export async function getPendingInstantEftRides(params?: { limit?: number }): Promise<{ rides: RideRow[] }> {
  const { data } = await api.get('/admin/payments/instant-eft/pending', {
    params: { limit: params?.limit ?? 200 },
  });
  return { rides: (data?.rides ?? []) as RideRow[] };
}

export async function approveInstantEftRide(rideId: number | string): Promise<void> {
  await api.post(`/admin/payments/instant-eft/${encodeURIComponent(String(rideId))}/approve`);
}

export async function rejectInstantEftRide(rideId: number | string, reason: string): Promise<void> {
  await api.post(`/admin/payments/instant-eft/${encodeURIComponent(String(rideId))}/reject`, { reason });
}

export interface PayoutDriverRow {
  driver_id: number | string;
  user_id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  completed_rides: number;
  total_earned: number;
  amount_owed_from_cash_rides?: number;
  cash_commission_remaining_from_cash_rides?: number;
}

export interface PayoutsResponse {
  totalToPayout: number;
  drivers: PayoutDriverRow[];
  totalCommissionOwed?: number;
  totalPlatformRevenue?: number;
}

export async function getPayouts(): Promise<PayoutsResponse> {
  const { data } = await api.get('/admin/payouts/rollup');
  return {
    totalToPayout: Number(data?.totalToPayout ?? 0),
    drivers: (data?.drivers ?? []) as PayoutDriverRow[],
    totalPlatformRevenue: Number(data?.totalPlatformRevenue ?? 0),
    totalCommissionOwed: Number(data?.totalCommissionOwed ?? 0),
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
  const { data } = await api.get('/admin/receipts', { params: { limit } });
  return { receipts: (data?.receipts ?? []) as ReceiptRow[] };
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
  const { data } = await api.get('/admin/trip-logs', { params: { limit } });
  const rows = (data?.trip_logs ?? []) as TripLogRow[];
  return { trip_logs: rows };
}
