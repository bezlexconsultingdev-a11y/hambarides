import { useCallback, useEffect, useState } from 'react';
import {
  approveCategoryUpgrade,
  getPendingCategoryUpgrades,
  rejectCategoryUpgrade,
  type CategoryUpgradeRequest,
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

export default function CategoryUpgradesPage() {
  const [requests, setRequests] = useState<CategoryUpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getPendingCategoryUpgrades({ limit: 200 })
      .then((data) => {
        setRequests(data.requests || []);
        setMigrationRequired(Boolean(data.migrationRequired));
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load category upgrades';
        setError(String(msg));
        setRequests([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const onApprove = (row: CategoryUpgradeRequest) => {
    const id = String(row.driver_id);
    setBusyId(id);
    approveCategoryUpgrade(row.driver_id)
      .then(() => load())
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Approve failed';
        window.alert(String(msg));
      })
      .finally(() => setBusyId(null));
  };

  const onReject = (row: CategoryUpgradeRequest) => {
    const reason =
      window.prompt(
        'Rejection reason (shown to driver):',
        'Vehicle does not meet category requirements'
      ) || '';
    if (!reason.trim()) return;
    const id = String(row.driver_id);
    setBusyId(id);
    rejectCategoryUpgrade(row.driver_id, reason.trim())
      .then(() => load())
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Reject failed';
        window.alert(String(msg));
      })
      .finally(() => setBusyId(null));
  };

  if (loading && requests.length === 0) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <h1 className={styles.title}>Category upgrades</h1>
      <DriversTabs />
      <p className={styles.muted}>
        Legacy remaps (economy → Lite, standard → Plus) happen automatically. Driver requests to move
        up a tier wait here for admin approval.
      </p>
      {migrationRequired ? (
        <p className={styles.apiError}>
          Run migration <code>20260810_driver_category_upgrade_requests.sql</code> on the database
          before upgrades can be stored.
        </p>
      ) : null}
      {error ? (
        <p className={styles.muted} style={{ color: '#b91c1c' }}>
          {error}
        </p>
      ) : null}

      {requests.length === 0 ? (
        <p className={styles.muted}>No pending category upgrades.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Current</th>
                <th>Requested</th>
                <th>Requested at</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => {
                const busy = busyId === String(row.driver_id);
                return (
                  <tr key={String(row.driver_id)}>
                    <td>
                      <div>{row.full_name || 'Unnamed driver'}</div>
                      <div className={styles.muted}>{row.email || row.phone || String(row.user_id)}</div>
                    </td>
                    <td>
                      <div>
                        {[row.vehicle_make, row.vehicle_model].filter(Boolean).join(' ') || '—'}
                      </div>
                      <div className={styles.muted}>
                        {[row.vehicle_year, row.vehicle_color, row.vehicle_plate_number]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </div>
                    </td>
                    <td>{row.current_label}</td>
                    <td>
                      <strong>{row.requested_label}</strong>
                    </td>
                    <td>{formatWhen(row.requested_at)}</td>
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
