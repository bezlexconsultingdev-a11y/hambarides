import { useCallback, useEffect, useState } from 'react';
import {
  approveVehicle,
  getPendingVehicleApprovals,
  rejectVehicle,
  type PendingVehicleApproval,
} from '../api/admin';
import DriversTabs from '../components/DriversTabs';
import styles from './TablePage.module.css';

function formatWhen(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function photoList(row: PendingVehicleApproval): string[] {
  const photos = row.photos;
  if (Array.isArray(photos)) return photos.filter(Boolean).map(String);
  if (photos && typeof photos === 'object') return Object.values(photos).filter(Boolean).map(String);
  return [];
}

export default function VehicleApprovalsPage() {
  const [vehicles, setVehicles] = useState<PendingVehicleApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getPendingVehicleApprovals({ limit: 200 })
      .then((data) => {
        setVehicles(data.vehicles || []);
        setMigrationRequired(Boolean(data.migrationRequired));
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load vehicle approvals';
        setError(String(msg));
        setVehicles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const onApprove = (row: PendingVehicleApproval) => {
    const id = String(row.id);
    setBusyId(id);
    approveVehicle(row.id, true)
      .then(() => load())
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Approve failed';
        window.alert(String(msg));
      })
      .finally(() => setBusyId(null));
  };

  const onReject = (row: PendingVehicleApproval) => {
    const reason =
      window.prompt('Rejection reason (shown to driver):', 'Vehicle documents or details incomplete') || '';
    if (!reason.trim()) return;
    const id = String(row.id);
    setBusyId(id);
    rejectVehicle(row.id, reason.trim())
      .then(() => load())
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Reject failed';
        window.alert(String(msg));
      })
      .finally(() => setBusyId(null));
  };

  if (loading && vehicles.length === 0) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <h1 className={styles.title}>Vehicle approvals</h1>
      <DriversTabs />
      <p className={styles.muted}>
        Approved drivers can add another car without redoing personal docs or banking. Review vehicle
        details and photos here, then approve or reject.
      </p>
      {migrationRequired ? (
        <p className={styles.apiError}>
          Run migration <code>20260915_driver_vehicles.sql</code> on the database before vehicle
          approvals can be stored.
        </p>
      ) : null}
      {error ? (
        <p className={styles.muted} style={{ color: '#b91c1c' }}>
          {error}
        </p>
      ) : null}

      {vehicles.length === 0 ? (
        <p className={styles.muted}>No pending vehicle submissions.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Driver</th>
                <th>New vehicle</th>
                <th>Category</th>
                <th>Photos</th>
                <th>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((row) => {
                const busy = busyId === String(row.id);
                const photos = photoList(row);
                return (
                  <tr key={String(row.id)}>
                    <td>
                      <div>{row.full_name || 'Unnamed driver'}</div>
                      <div className={styles.muted}>{row.email || row.phone || String(row.user_id || '')}</div>
                      <div className={styles.muted}>Current: {row.current_active_vehicle || '—'}</div>
                    </td>
                    <td>
                      <div>
                        {[row.year, row.make, row.model].filter(Boolean).join(' ')} · {row.color}
                      </div>
                      <div className={styles.muted}>{row.plate_number}</div>
                      <div className={styles.muted}>
                        {[
                          row.door_count != null ? `${row.door_count} doors` : null,
                          row.passenger_seats != null ? `${row.passenger_seats} seats` : null,
                          row.body_type,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </div>
                    </td>
                    <td>
                      <strong>{row.requested_label || row.vehicle_type}</strong>
                    </td>
                    <td>
                      {photos.length === 0 ? (
                        <span className={styles.muted}>None</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 220 }}>
                          {photos.slice(0, 6).map((url) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer">
                              <img
                                src={url}
                                alt="Vehicle"
                                style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>{formatWhen(row.submitted_at)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        disabled={busy}
                        onClick={() => onApprove(row)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        disabled={busy}
                        onClick={() => onReject(row)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
