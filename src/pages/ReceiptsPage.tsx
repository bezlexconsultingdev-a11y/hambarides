import { useState, useEffect } from 'react';
import { api } from '../api/client';
import styles from './TablePage.module.css';

interface ReceiptRow {
  id: number;
  ride_id: number;
  rider_id: number;
  driver_id: number;
  fare_amount: number;
  payment_method: string;
  created_at: string;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ receipts: ReceiptRow[] }>('/admin/receipts', { params: { limit: 100 } })
      .then((res) => setReceipts(res.data.receipts ?? []))
      .catch(() => setReceipts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div>
      <h1 className={styles.title}>Receipts</h1>
      <p className={styles.muted}>
        Digital receipts for completed rides. Backend: GET /admin/receipts.
      </p>
      {receipts.length === 0 ? (
        <p className={styles.muted}>No receipts yet, or backend endpoint not configured.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ride ID</th>
                <th>Rider ID</th>
                <th>Driver ID</th>
                <th>Fare (R)</th>
                <th>Payment</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.ride_id}</td>
                  <td>{r.rider_id}</td>
                  <td>{r.driver_id}</td>
                  <td>{Number(r.fare_amount).toFixed(2)}</td>
                  <td>{r.payment_method ?? '–'}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
