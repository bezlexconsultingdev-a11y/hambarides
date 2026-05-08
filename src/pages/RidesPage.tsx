import { useState, useEffect, useMemo } from 'react';
import { approveInstantEftRide, getPendingInstantEftRides, getRides, rejectInstantEftRide } from '../api/admin';
import type { RideRow } from '../api/admin';
import styles from './TablePage.module.css';
import axios from 'axios';

const PLATFORM_SHARE = 0.21;

function exportRidesCsv(rides: RideRow[]) {
  const headers = ['ID', 'Type', 'Rider ID', 'Driver ID', 'Pickup', 'Dropoff', 'Status', 'Fare (R)', 'Platform 21% (R)', 'Requested'];
  const rows = rides.map((r) => {
    const fare = r.fare_amount != null ? Number(r.fare_amount) : 0;
    const platform = fare * PLATFORM_SHARE;
    return [
      r.id,
      r.ride_type ?? 'standard',
      r.rider_id,
      r.driver_id ?? '',
      `"${(r.pickup_address || '').replace(/"/g, '""')}"`,
      `"${(r.dropoff_address || '').replace(/"/g, '""')}"`,
      r.status,
      fare.toFixed(2),
      platform.toFixed(2),
      new Date(r.requested_at).toISOString(),
    ].join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `rides-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function RidesPage() {
  const [rides, setRides] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [rideTypeFilter, setRideTypeFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pendingEft, setPendingEft] = useState<RideRow[]>([]);
  const [processingRideId, setProcessingRideId] = useState<string>('');
  const [actionError, setActionError] = useState('');
  const [pendingEftError, setPendingEftError] = useState('');

  useEffect(() => {
    getRides({ limit: 500, status: statusFilter || undefined })
      .then((d) => setRides(d.rides))
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const refreshPendingEft = async () => {
    setPendingEftError('');
    try {
      const data = await getPendingInstantEftRides({ limit: 200 });
      setPendingEft(data.rides);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? String(error.response?.data?.error || error.response?.data?.message || error.message)
        : 'Failed to load pending Instant EFT approvals';
      setPendingEftError(message);
      setPendingEft([]);
    }
  };

  useEffect(() => {
    void refreshPendingEft();
  }, []);

  const handleApproveEft = async (rideId: number | string) => {
    const key = String(rideId);
    setProcessingRideId(key);
    setActionError('');
    try {
      await approveInstantEftRide(rideId);
      await Promise.all([
        refreshPendingEft(),
        getRides({ limit: 500, status: statusFilter || undefined }).then((d) => setRides(d.rides)),
      ]);
    } catch {
      setActionError(`Failed to approve Instant EFT for ride #${key}`);
    } finally {
      setProcessingRideId('');
    }
  };

  const handleRejectEft = async (rideId: number | string) => {
    const key = String(rideId);
    const reason = window.prompt('Reason for rejection', 'Instant EFT payment not verified');
    if (reason == null) return;
    setProcessingRideId(key);
    setActionError('');
    try {
      await rejectInstantEftRide(rideId, reason);
      await Promise.all([
        refreshPendingEft(),
        getRides({ limit: 500, status: statusFilter || undefined }).then((d) => setRides(d.rides)),
      ]);
    } catch {
      setActionError(`Failed to reject Instant EFT for ride #${key}`);
    } finally {
      setProcessingRideId('');
    }
  };

  const filteredRides = useMemo(() => {
    let list = rides;
    if (rideTypeFilter) {
      list = list.filter((r) => r.ride_type === rideTypeFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((r) => new Date(r.requested_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((r) => new Date(r.requested_at) <= to);
    }
    return list;
  }, [rides, rideTypeFilter, dateFrom, dateTo]);

  const totalPlatform = useMemo(
    () => filteredRides.reduce((sum, r) => sum + (r.fare_amount != null ? Number(r.fare_amount) * PLATFORM_SHARE : 0), 0),
    [filteredRides]
  );

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Rides</h1>
      <h2 className={styles.subtitle}>Instant EFT Approval Queue</h2>
      {actionError ? <p className={styles.muted}>{actionError}</p> : null}
      {pendingEftError ? <p className={styles.muted}>Queue error: {pendingEftError}</p> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ride ID</th>
              <th>Rider</th>
              <th>Reference</th>
              <th>Fare (R)</th>
              <th>Requested</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingEft.length === 0 ? (
              <tr>
                <td colSpan={6}>No pending Instant EFT approvals.</td>
              </tr>
            ) : (
              pendingEft.map((r) => {
                const rideId = String(r.id);
                const busy = processingRideId === rideId;
                const riderName = `${r.rider_first_name ?? ''} ${r.rider_last_name ?? ''}`.trim() || String(r.rider_id);
                return (
                  <tr key={`eft-${rideId}`}>
                    <td>{rideId}</td>
                    <td>{riderName}</td>
                    <td>{r.payment_reference || '—'}</td>
                    <td>{r.fare_amount != null ? Number(r.fare_amount).toFixed(2) : '—'}</td>
                    <td>{new Date(r.requested_at).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleApproveEft(r.id)}
                        className={styles.btnPrimary}
                        disabled={busy}
                      >
                        {busy ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectEft(r.id)}
                        className={styles.btnDanger}
                        disabled={busy}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.toolbar}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.select}
        >
          <option value="">All statuses</option>
          <option value="dispatching">Dispatching</option>
          <option value="awaiting_payment">Awaiting payment</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="arrived">Arrived</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={rideTypeFilter}
          onChange={(e) => setRideTypeFilter(e.target.value)}
          className={styles.select}
        >
          <option value="">All ride types</option>
          <option value="economy">Economy</option>
          <option value="economy_women">Economy Women</option>
          <option value="standard">Standard</option>
          <option value="standard_women">Standard Women</option>
        </select>
        <label className={styles.dateLabel}>
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={styles.dateInput}
          />
        </label>
        <label className={styles.dateLabel}>
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={styles.dateInput}
          />
        </label>
        <button type="button" onClick={() => exportRidesCsv(filteredRides)} className={styles.exportBtn}>
          Export CSV
        </button>
      </div>
      <p className={styles.muted}>
        Platform share (21%): R {totalPlatform.toFixed(2)} from {filteredRides.length} ride(s)
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Rider ID</th>
              <th>Driver ID</th>
              <th>Pickup</th>
              <th>Dropoff</th>
              <th>Status</th>
              <th>Fare (R)</th>
              <th>Platform 21% (R)</th>
              <th>Requested</th>
            </tr>
          </thead>
          <tbody>
            {filteredRides.map((r) => {
              const fare = r.fare_amount != null ? Number(r.fare_amount) : 0;
              const platform = fare * PLATFORM_SHARE;
              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.ride_type ?? 'standard'}</td>
                  <td>{r.rider_id}</td>
                  <td>{r.driver_id ?? '–'}</td>
                  <td className={styles.cellClip}>{r.pickup_address}</td>
                  <td className={styles.cellClip}>{r.dropoff_address}</td>
                  <td>{r.status}</td>
                  <td>{fare > 0 ? fare.toFixed(2) : '–'}</td>
                  <td>{fare > 0 ? platform.toFixed(2) : '–'}</td>
                  <td>{new Date(r.requested_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
