import { useState, useEffect } from 'react';
import { getSosEvents } from '../api/admin';
import type { SosEventRow } from '../api/admin';
import styles from './TablePage.module.css';

export default function SosEventsPage() {
  const [events, setEvents] = useState<SosEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSosEvents({ limit: 100 })
      .then((d) => setEvents(d.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>SOS events</h1>
      <p className={styles.muted}>
        Emergency alerts from riders or drivers. Contact and ride info for follow-up.
      </p>
      {events.length === 0 ? (
        <p className={styles.muted}>No SOS events recorded.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Ride ID</th>
                <th>Location</th>
                <th>Emergency phone</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.user_id}</td>
                  <td>{e.ride_id ?? '–'}</td>
                  <td>
                    {e.latitude != null && e.longitude != null
                      ? `${Number(e.latitude).toFixed(4)}, ${Number(e.longitude).toFixed(4)}`
                      : '–'}
                  </td>
                  <td>{e.emergency_phone}</td>
                  <td>{new Date(e.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
