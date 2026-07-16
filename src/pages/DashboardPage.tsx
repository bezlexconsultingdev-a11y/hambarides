import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  const primary = [
    { label: 'Revenue (R)', value: stats.totalRevenue.toFixed(2), to: '/rides' },
    { label: 'Trips today / total', value: String(stats.totalRides), to: '/rides' },
    { label: 'Approved drivers', value: String(stats.approvedDrivers ?? stats.totalDrivers), to: '/drivers' },
    { label: 'Pending applications', value: String(stats.pendingApplications ?? 0), to: '/applications' },
  ];

  const secondary = [
    { label: 'Riders', value: stats.totalRiders },
    { label: 'Active rides', value: stats.pendingRides },
    { label: 'Completed rides', value: stats.completedRides },
    { label: 'Platform 21% (R)', value: (stats.totalCommission ?? 0).toFixed(2) },
    { label: 'Cash commission owed (R)', value: (stats.totalCommissionOwed ?? 0).toFixed(2) },
    { label: 'To payout drivers (R)', value: (stats.totalToPayout ?? 0).toFixed(2) },
  ];

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Live snapshot of Hamba Rides operations</p>
        </div>
        <div className={styles.quickLinks}>
          <Link className={styles.quickLink} to="/applications">
            Review applications
          </Link>
          <Link className={styles.quickLinkPrimary} to="/payouts-management">
            Pay drivers
          </Link>
        </div>
      </div>

      <div className={styles.primaryGrid}>
        {primary.map((c) => (
          <Link key={c.label} to={c.to} className={styles.primaryCard}>
            <span className={styles.cardLabel}>{c.label}</span>
            <span className={styles.cardValue}>{c.value}</span>
          </Link>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>More stats</h2>
      <div className={styles.grid}>
        {secondary.map((c) => (
          <div key={c.label} className={styles.card}>
            <span className={styles.cardLabel}>{c.label}</span>
            <span className={styles.cardValueSmall}>{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
