import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './PricingPage.module.css';

interface PricingRow {
  id: number;
  ride_type: string;
  base_fare: number;
  rate_per_km: number;
  rate_per_minute: number;
  minimum_fare: number;
  booking_fee_percent: number;
  max_surge_multiplier: number;
}

export default function PricingPage() {
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPricing();
  }, []);

  async function loadPricing() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .order('ride_type');
    if (error) {
      setMessage('Failed to load pricing config');
    } else {
      setRows((data || []).map((r: any) => ({
        ...r,
        base_fare: Number(r.base_fare),
        rate_per_km: Number(r.rate_per_km),
        rate_per_minute: Number(r.rate_per_minute),
        minimum_fare: Number(r.minimum_fare),
        booking_fee_percent: Number(r.booking_fee_percent),
        max_surge_multiplier: Number(r.max_surge_multiplier),
      })));
    }
    setLoading(false);
  }

  function updateField(id: number, field: keyof PricingRow, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: parseFloat(value) || 0 } : r
      )
    );
  }

  async function saveAll() {
    setSaving(true);
    setMessage('');
    try {
      for (const row of rows) {
        const { error } = await supabase
          .from('pricing_config')
          .update({
            base_fare: row.base_fare,
            rate_per_km: row.rate_per_km,
            rate_per_minute: row.rate_per_minute,
            minimum_fare: row.minimum_fare,
            booking_fee_percent: row.booking_fee_percent,
            max_surge_multiplier: row.max_surge_multiplier,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (error) throw error;
      }
      setMessage('Pricing saved successfully!');
    } catch (err) {
      setMessage('Failed to save pricing. Check console.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading pricing...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pricing Configuration</h1>
        <p className={styles.subtitle}>
          Manage fare rates for Economy and Standard ride types. Changes take effect within 5 minutes.
        </p>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.grid}>
        {rows.map((row) => (
          <div key={row.id} className={styles.card}>
            <h2 className={styles.cardTitle}>
              {row.ride_type.charAt(0).toUpperCase() + row.ride_type.slice(1)}
            </h2>
            <div className={styles.fields}>
              <label>
                Base Fare (R)
                <input
                  type="number"
                  step="0.01"
                  value={row.base_fare}
                  onChange={(e) => updateField(row.id, 'base_fare', e.target.value)}
                />
              </label>
              <label>
                Rate per km (R)
                <input
                  type="number"
                  step="0.01"
                  value={row.rate_per_km}
                  onChange={(e) => updateField(row.id, 'rate_per_km', e.target.value)}
                />
              </label>
              <label>
                Rate per minute (R)
                <input
                  type="number"
                  step="0.01"
                  value={row.rate_per_minute}
                  onChange={(e) => updateField(row.id, 'rate_per_minute', e.target.value)}
                />
              </label>
              <label>
                Minimum Fare (R)
                <input
                  type="number"
                  step="0.01"
                  value={row.minimum_fare}
                  onChange={(e) => updateField(row.id, 'minimum_fare', e.target.value)}
                />
              </label>
              <label>
                Booking Fee (%)
                <input
                  type="number"
                  step="0.01"
                  value={row.booking_fee_percent}
                  onChange={(e) => updateField(row.id, 'booking_fee_percent', e.target.value)}
                />
              </label>
              <label>
                Max Surge Multiplier
                <input
                  type="number"
                  step="0.01"
                  value={row.max_surge_multiplier}
                  onChange={(e) => updateField(row.id, 'max_surge_multiplier', e.target.value)}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        className={styles.saveBtn}
        onClick={saveAll}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save All Changes'}
      </button>
    </div>
  );
}
