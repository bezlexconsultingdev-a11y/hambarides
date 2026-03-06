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
  const { data } = await api.get<{ stats: DashboardStats }>('/admin/dashboard');
  return data;
}

export interface UserRow {
  id: number;
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
  const { data } = await api.get<{ users: UserRow[] }>('/admin/users', { params });
  return data;
}

export interface DriverRow {
  id: number;
  user_id: number;
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
  const { data } = await api.get<{ drivers: DriverRow[] }>('/admin/drivers', { params });
  return data;
}

export interface DriverApplicationRow {
  id: number;
  driver_id: number;
  user_id: number;
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
  const { data } = await api.get<{ applications: DriverApplicationRow[] }>('/admin/drivers/applications/pending', { params });
  return data;
}

export async function approveApplication(id: number): Promise<{ application: DriverApplicationRow }> {
  const { data } = await api.post<{ application: DriverApplicationRow }>(`/admin/drivers/applications/${id}/approve`);
  return data;
}

export async function declineApplication(id: number, reason?: string): Promise<{ application: DriverApplicationRow }> {
  const { data } = await api.post<{ application: DriverApplicationRow }>(`/admin/drivers/applications/${id}/decline`, { reason });
  return data;
}

export interface RideRow {
  id: number;
  rider_id: number;
  driver_id: number | null;
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
  const { data } = await api.get<{ rides: RideRow[] }>('/admin/rides', { params });
  return data;
}

export interface PayoutDriverRow {
  driver_id: number;
  user_id: number;
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
  const { data } = await api.get<PayoutsResponse>('/admin/payouts');
  return data;
}

export interface SosEventRow {
  id: number;
  ride_id: number | null;
  user_id: number;
  latitude: number | null;
  longitude: number | null;
  emergency_phone: string;
  created_at: string;
}

export async function getSosEvents(params?: { limit?: number }): Promise<{ events: SosEventRow[] }> {
  try {
    const { data } = await api.get<{ events: SosEventRow[] }>('/admin/sos', { params });
    return data;
  } catch {
    return { events: [] };
  }
}
