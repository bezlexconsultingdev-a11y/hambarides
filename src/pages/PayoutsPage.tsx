import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { getPayouts } from '../api/admin';
import type { PayoutDriverRow } from '../api/admin';
import styles from './TablePage.module.css';

export default function PayoutsPage() {
  const [totalToPayout, setTotalToPayout] = useState(0);
  const [drivers, setDrivers] = useState<PayoutDriverRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [commissionOwed, setCommissionOwed] = useState<number | null>(null);
  const [platformRevenue, setPlatformRevenue] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    getPayouts()
      .then((res) => {
        setTotalToPayout(res.totalToPayout);
        setDrivers(res.drivers);
        setCommissionOwed(res.totalCommissionOwed ?? null);
        setPlatformRevenue(res.totalPlatformRevenue ?? null);
      })
      .catch((err) => {
        setTotalToPayout(0);
        setDrivers([]);
        setCommissionOwed(null);
        setPlatformRevenue(null);
        const msg = isAxiosError(err)
          ? String(err.response?.data?.error || err.response?.data?.message || err.message || 'Request failed')
          : 'Could not load payouts';
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Payouts</h1>
      {loadError && (
        <p className={styles.apiError} role="alert">
          Could not load payouts: {loadError}. Confirm the API is deployed and{' '}
          <code>SUPABASE_SERVICE_KEY</code> is set on the server (anon key returns empty data). Use the backend{' '}
          <code>/health</code> endpoint (drop <code>/api</code> from the base URL) — <code>supabaseClient</code> should be{' '}
          <code>service_role</code>.
        </p>
      )}
      <p className={styles.muted}>
        Matches the driver app &quot;available&quot; payout total: cash and COD are excluded (driver already collected
        that fare). Instant EFT, card, and other platform-collected trips count toward bank payout using the 79% / 21%
        split on eligible fare.
      </p>

      <div className={styles.payoutSummary}>
        <span className={styles.payoutLabel}>Total to payout (drivers)</span>
        <span className={styles.payoutValue}>R {totalToPayout.toFixed(2)}</span>
      </div>
      {platformRevenue != null && (
        <div className={styles.payoutSummary}>
          <span className={styles.payoutLabel}>Platform revenue (21%)</span>
          <span className={styles.payoutValue}>R {platformRevenue.toFixed(2)}</span>
        </div>
      )}
      {commissionOwed != null && commissionOwed > 0 && (
        <div className={styles.payoutSummary}>
          <span className={styles.payoutLabel}>Cash commission created (21% from cash rides)</span>
          <span className={styles.payoutValue}>R {commissionOwed.toFixed(2)}</span>
        </div>
      )}

      <h2 className={styles.subtitle}>Per driver</h2>
      {drivers.length === 0 ? (
        <p className={styles.muted}>No driver earnings yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Email</th>
                <th>Completed trips</th>
                <th>Total earned (R)</th>
                <th>Cash commission created (R)</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.driver_id}>
                  <td>{d.first_name} {d.last_name}</td>
                  <td>{d.email}</td>
                  <td>{d.completed_rides}</td>
                  <td>{d.total_earned.toFixed(2)}</td>
                  <td>{Number(d.amount_owed_from_cash_rides ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
