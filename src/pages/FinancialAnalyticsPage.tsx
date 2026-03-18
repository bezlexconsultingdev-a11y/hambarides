import { useState, useEffect } from 'react';
import { api } from '../api/client';
import styles from './FinancialAnalyticsPage.module.css';

interface RevenueData {
  date: string;
  rides: number;
  revenue: number;
  commission: number;
  driver_earnings: number;
}

export default function FinancialAnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [analytics, setAnalytics] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalDriverEarnings: 0,
    totalRides: 0,
    averageRideValue: 0,
    commissionRate: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/revenue?period=${period}`);
      const data = response.data.analytics;
      setAnalytics(data);

      // Calculate totals
      const totals = data.reduce((acc: any, item: RevenueData) => ({
        revenue: acc.revenue + item.revenue,
        commission: acc.commission + item.commission,
        driverEarnings: acc.driverEarnings + item.driver_earnings,
        rides: acc.rides + item.rides
      }), { revenue: 0, commission: 0, driverEarnings: 0, rides: 0 });

      setStats({
        totalRevenue: totals.revenue,
        totalCommission: totals.commission,
        totalDriverEarnings: totals.driverEarnings,
        totalRides: totals.rides,
        averageRideValue: totals.rides > 0 ? totals.revenue / totals.rides : 0,
        commissionRate: totals.revenue > 0 ? (totals.commission / totals.revenue) * 100 : 0
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Rides', 'Revenue', 'Commission', 'Driver Earnings'];
    const rows = analytics.map(item => [
      item.date,
      item.rides,
      item.revenue.toFixed(2),
      item.commission.toFixed(2),
      item.driver_earnings.toFixed(2)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className={styles.loading}>Loading analytics...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Financial Analytics</h1>
          <p className={styles.subtitle}>Revenue and earnings overview</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.periodSelector}>
            <button
              className={period === 'week' ? styles.periodButtonActive : styles.periodButton}
              onClick={() => setPeriod('week')}
            >
              Week
            </button>
            <button
              className={period === 'month' ? styles.periodButtonActive : styles.periodButton}
              onClick={() => setPeriod('month')}
            >
              Month
            </button>
            <button
              className={period === 'year' ? styles.periodButtonActive : styles.periodButton}
              onClick={() => setPeriod('year')}
            >
              Year
            </button>
          </div>
          <button className={styles.exportButton} onClick={exportToCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Revenue</div>
          <div className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
          <div className={styles.statSubtext}>{stats.totalRides} rides</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Platform Commission</div>
          <div className={styles.statValue}>{formatCurrency(stats.totalCommission)}</div>
          <div className={styles.statSubtext}>{stats.commissionRate.toFixed(1)}% rate</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Driver Earnings</div>
          <div className={styles.statValue}>{formatCurrency(stats.totalDriverEarnings)}</div>
          <div className={styles.statSubtext}>Total paid to drivers</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Average Ride Value</div>
          <div className={styles.statValue}>{formatCurrency(stats.averageRideValue)}</div>
          <div className={styles.statSubtext}>Per completed ride</div>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <h2>Revenue Trend</h2>
        <div className={styles.chart}>
          {analytics.length === 0 ? (
            <div className={styles.emptyChart}>No data available for this period</div>
          ) : (
            <div className={styles.barChart}>
              {analytics.map((item, index) => {
                const maxRevenue = Math.max(...analytics.map(a => a.revenue));
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={index} className={styles.barGroup}>
                    <div className={styles.barContainer}>
                      <div 
                        className={styles.bar}
                        style={{ height: `${height}%` }}
                        title={`${formatCurrency(item.revenue)} - ${item.rides} rides`}
                      >
                        <div className={styles.barValue}>
                          {item.revenue > 0 && formatCurrency(item.revenue)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.barLabel}>{formatDate(item.date)}</div>
                    <div className={styles.barSubLabel}>{item.rides} rides</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={styles.tableContainer}>
        <h2>Detailed Breakdown</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Rides</th>
              <th>Revenue</th>
              <th>Commission</th>
              <th>Driver Earnings</th>
              <th>Avg Ride</th>
            </tr>
          </thead>
          <tbody>
            {analytics.map((item, index) => (
              <tr key={index}>
                <td>{formatDate(item.date)}</td>
                <td>{item.rides}</td>
                <td>{formatCurrency(item.revenue)}</td>
                <td>{formatCurrency(item.commission)}</td>
                <td>{formatCurrency(item.driver_earnings)}</td>
                <td>{formatCurrency(item.rides > 0 ? item.revenue / item.rides : 0)}</td>
              </tr>
            ))}
            {analytics.length > 0 && (
              <tr className={styles.totalRow}>
                <td><strong>Total</strong></td>
                <td><strong>{stats.totalRides}</strong></td>
                <td><strong>{formatCurrency(stats.totalRevenue)}</strong></td>
                <td><strong>{formatCurrency(stats.totalCommission)}</strong></td>
                <td><strong>{formatCurrency(stats.totalDriverEarnings)}</strong></td>
                <td><strong>{formatCurrency(stats.averageRideValue)}</strong></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
