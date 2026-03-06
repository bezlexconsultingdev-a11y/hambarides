import { useState, useEffect } from 'react';
import { api } from '../api/client';
import styles from './TablePage.module.css';

interface TripLogRow {
  id: number;
  ride_id: number;
  driver_id: number;
  rider_id: number;
  pickup_address: string;
  dropoff_address: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export default function TripLogsPage() {
  const [logs, setLogs] = useState<TripLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ trip_logs: TripLogRow[] }>('/admin/trip-logs', { params: { limit: 100 } })
      .then((res) => setLogs(res.data.trip_logs ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Trip logs</h1>
      <p className={styles.muted}>
        Stored trip logs for support and disputes. Backend: GET /admin/trip-logs.
      </p>
      {logs.length === 0 ? (
        <p className={styles.muted}>No trip logs yet, or backend endpoint not configured.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ride ID</th>
                <th>Driver</th>
                <th>Rider</th>
                <th>Pickup</th>
                <th>Dropoff</th>
                <th>Started</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.ride_id}</td>
                  <td>{l.driver_id}</td>
                  <td>{l.rider_id}</td>
                  <td className={styles.cellClip}>{l.pickup_address}</td>
                  <td className={styles.cellClip}>{l.dropoff_address}</td>
                  <td>{l.started_at ? new Date(l.started_at).toLocaleString() : '–'}</td>
                  <td>{l.completed_at ? new Date(l.completed_at).toLocaleString() : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
