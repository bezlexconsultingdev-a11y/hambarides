import { useState, useEffect } from 'react';
import { getDashboard } from '../api/admin';
import type { DashboardStats } from '../api/admin';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = () =>
      getDashboard()
        .then((d) => {
          if (!mounted) return;
          setStats(d.stats);
          setError('');
        })
        .catch((err: unknown) => {
          if (!mounted) return;
          const maybe = err as { response?: { data?: { error?: string } }; message?: string };
          setError(maybe?.response?.data?.error || maybe?.message || 'Failed to load dashboard');
        })
        .finally(() => {
          if (!mounted) return;
          setLoading(false);
        });

    void load();
    const id = setInterval(() => {
      void load();
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!stats) return null;

  const cards = [
    { label: 'Total users', value: stats.totalUsers },
    { label: 'Riders', value: stats.totalRiders },
    { label: 'Driver profiles (all)', value: stats.totalDrivers },
    { label: 'Approved drivers', value: stats.approvedDrivers ?? '—' },
    { label: 'Pending driver applications', value: stats.pendingApplications ?? '—' },
    { label: 'Total rides', value: stats.totalRides },
    { label: 'Completed rides', value: stats.completedRides },
    { label: 'Active / in-progress rides', value: stats.pendingRides },
    { label: 'Revenue from receipts (R)', value: stats.totalRevenue.toFixed(2) },
    { label: 'Platform 21% (R)', value: (stats.totalCommission ?? 0).toFixed(2) },
    { label: 'Amount drivers owe from cash (R)', value: (stats.totalCommissionOwed ?? 0).toFixed(2) },
    { label: 'Total to payout drivers (R)', value: (stats.totalToPayout ?? 0).toFixed(2) },
  ];

  return (
    <div>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.grid}>
        {cards.map((c) => (
          <div key={c.label} className={styles.card}>
            <span className={styles.cardLabel}>{c.label}</span>
            <span className={styles.cardValue}>{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
