import { useState, useEffect } from 'react';
import { api } from '../api/client';
import styles from './DriverPerformancePage.module.css';

interface DriverPerformance {
  driver_id: string;
  driver_name: string;
  email: string;
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  acceptance_rate: number;
  cancellation_rate: number;
  average_rating: number;
  total_earned: number;
  performance_score: number;
}

export default function DriverPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DriverPerformance[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'rides' | 'earnings' | 'performance'>('performance');
  const [filterStatus, setFilterStatus] = useState<'all' | 'top' | 'low'>('all');

  useEffect(() => {
    loadPerformance();
  }, [sortBy, filterStatus]);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/driver-performance?sort=${sortBy}&filter=${filterStatus}`);
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error('Failed to load driver performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading driver performance...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Driver Performance</h1>
        <div className={styles.filters}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className={styles.select}>
            <option value="performance">Performance Score</option>
            <option value="rating">Average Rating</option>
            <option value="rides">Total Rides</option>
            <option value="earnings">Total Earnings</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className={styles.select}>
            <option value="all">All Drivers</option>
            <option value="top">Top Performers</option>
            <option value="low">Low Performers</option>
          </select>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Drivers</h3>
          <p className={styles.statValue}>{drivers.length}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Avg Performance</h3>
          <p className={styles.statValue}>
            {drivers.length > 0 ? (drivers.reduce((sum, d) => sum + d.performance_score, 0) / drivers.length).toFixed(1) : '0'}%
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Avg Rating</h3>
          <p className={styles.statValue}>
            {drivers.length > 0 ? (drivers.reduce((sum, d) => sum + d.average_rating, 0) / drivers.length).toFixed(2) : '0'}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Rides</h3>
          <p className={styles.statValue}>
            {drivers.reduce((sum, d) => sum + d.total_rides, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Performance</th>
              <th>Rating</th>
              <th>Rides</th>
              <th>Acceptance</th>
              <th>Cancellation</th>
              <th>Earnings</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.driver_id}>
                <td>
                  <div className={styles.driverInfo}>
                    <strong>{driver.driver_name}</strong>
                    <span className={styles.email}>{driver.email}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.performanceCell}>
                    <div 
                      className={styles.performanceBar}
                      style={{ 
                        width: `${driver.performance_score}%`,
                        backgroundColor: getPerformanceColor(driver.performance_score)
                      }}
                    />
                    <span>{driver.performance_score.toFixed(1)}%</span>
                  </div>
                </td>
                <td>
                  <div className={styles.rating}>
                    ⭐ {driver.average_rating.toFixed(2)}
                  </div>
                </td>
                <td>{driver.total_rides}</td>
                <td>
                  <span className={driver.acceptance_rate >= 80 ? styles.good : styles.warning}>
                    {driver.acceptance_rate.toFixed(1)}%
                  </span>
                </td>
                <td>
                  <span className={driver.cancellation_rate <= 10 ? styles.good : styles.warning}>
                    {driver.cancellation_rate.toFixed(1)}%
                  </span>
                </td>
                <td>R {driver.total_earned.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drivers.length === 0 && (
        <div className={styles.empty}>
          <p>No drivers found</p>
        </div>
      )}
    </div>
  );
}
