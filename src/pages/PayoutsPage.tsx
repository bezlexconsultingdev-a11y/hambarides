import { useState, useEffect } from 'react';
import { getPayouts } from '../api/admin';
import type { PayoutDriverRow } from '../api/admin';
import styles from './TablePage.module.css';

export default function PayoutsPage() {
  const [totalToPayout, setTotalToPayout] = useState(0);
  const [drivers, setDrivers] = useState<PayoutDriverRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [commissionOwed, setCommissionOwed] = useState<number | null>(null);
  const [platformRevenue, setPlatformRevenue] = useState<number | null>(null);

  useEffect(() => {
    getPayouts()
      .then((res) => {
        setTotalToPayout(res.totalToPayout);
        setDrivers(res.drivers);
        setCommissionOwed(res.totalCommissionOwed ?? null);
        setPlatformRevenue(res.totalPlatformRevenue ?? null);
      })
      .catch(() => {
        setTotalToPayout(0);
        setDrivers([]);
        setCommissionOwed(null);
        setPlatformRevenue(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Payouts</h1>
      <p className={styles.muted}>
        Driver earnings (79%) and platform share (21%). Amount drivers owe from cash rides is deducted from future card payouts.
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
          <span className={styles.payoutLabel}>Amount drivers owe (from cash rides)</span>
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
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.driver_id}>
                  <td>{d.first_name} {d.last_name}</td>
                  <td>{d.email}</td>
                  <td>{d.completed_rides}</td>
                  <td>{d.total_earned.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
