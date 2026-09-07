import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../api/client';
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

interface DisplayDiscountSettings {
  enabled: boolean;
  discount_pct: number;
  banner_text: string;
  badge_text: string;
  breakdown_label: string;
  footer_caption: string;
  starts_at: string | null;
  ends_at: string | null;
}

const DISPLAY_DEFAULTS: DisplayDiscountSettings = {
  enabled: false,
  discount_pct: 21,
  banner_text: '21% off · Launch special',
  badge_text: '21% OFF',
  breakdown_label: 'Launch discount (21%)',
  footer_caption: 'You pay the normal fare. 21% off vs list price.',
  starts_at: null,
  ends_at: null,
};

export default function PricingPage() {
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [displaySettings, setDisplaySettings] = useState<DisplayDiscountSettings>(DISPLAY_DEFAULTS);
  const [savingDisplay, setSavingDisplay] = useState(false);

  useEffect(() => {
    loadPricing();
    loadDisplayDiscount();
  }, []);

  async function loadDisplayDiscount() {
    try {
      const res = await api.get('/admin/promotions/display-discount');
      const s = res.data?.settings || {};
      setDisplaySettings({
        enabled: Boolean(s.enabled),
        discount_pct: Number(s.discount_pct) || 21,
        banner_text: s.banner_text || DISPLAY_DEFAULTS.banner_text,
        badge_text: s.badge_text || DISPLAY_DEFAULTS.badge_text,
        breakdown_label: s.breakdown_label || DISPLAY_DEFAULTS.breakdown_label,
        footer_caption: s.footer_caption || DISPLAY_DEFAULTS.footer_caption,
        starts_at: s.starts_at || null,
        ends_at: s.ends_at || null,
      });
    } catch (err) {
      console.warn('display discount load failed', err);
    }
  }

  async function saveDisplayDiscount() {
    setSavingDisplay(true);
    setMessage('');
    try {
      const res = await api.put('/admin/promotions/display-discount', displaySettings);
      const s = res.data?.settings || displaySettings;
      setDisplaySettings({
        enabled: Boolean(s.enabled),
        discount_pct: Number(s.discount_pct) || 21,
        banner_text: s.banner_text || DISPLAY_DEFAULTS.banner_text,
        badge_text: s.badge_text || DISPLAY_DEFAULTS.badge_text,
        breakdown_label: s.breakdown_label || DISPLAY_DEFAULTS.breakdown_label,
        footer_caption: s.footer_caption || DISPLAY_DEFAULTS.footer_caption,
        starts_at: s.starts_at || null,
        ends_at: s.ends_at || null,
      });
      setMessage('Display discount settings saved.');
    } catch (err: any) {
      setMessage(
        err?.response?.data?.error ||
          'Failed to save display discount. Run the Supabase migration first.'
      );
    } finally {
      setSavingDisplay(false);
    }
  }

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

      <div className={styles.card} style={{ marginBottom: 24 }}>
        <h2 className={styles.cardTitle}>Display discount (marketing only)</h2>
        <p className={styles.subtitle} style={{ marginBottom: 16 }}>
          Inflates the shown list price by {displaySettings.discount_pct}%, then shows that amount as a
          discount. Rider still pays the normal fare. Driver/platform split unchanged.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={displaySettings.enabled}
            onChange={(e) =>
              setDisplaySettings((prev) => ({ ...prev, enabled: e.target.checked }))
            }
          />
          Enable display discount in rider app
        </label>
        <div className={styles.fields}>
          <label>
            Banner text
            <input
              type="text"
              maxLength={60}
              value={displaySettings.banner_text}
              onChange={(e) =>
                setDisplaySettings((prev) => ({ ...prev, banner_text: e.target.value }))
              }
            />
          </label>
          <label>
            Badge text
            <input
              type="text"
              maxLength={16}
              value={displaySettings.badge_text}
              onChange={(e) =>
                setDisplaySettings((prev) => ({ ...prev, badge_text: e.target.value }))
              }
            />
          </label>
          <label>
            Breakdown label
            <input
              type="text"
              maxLength={40}
              value={displaySettings.breakdown_label}
              onChange={(e) =>
                setDisplaySettings((prev) => ({ ...prev, breakdown_label: e.target.value }))
              }
            />
          </label>
          <label>
            Footer caption
            <input
              type="text"
              maxLength={100}
              value={displaySettings.footer_caption}
              onChange={(e) =>
                setDisplaySettings((prev) => ({ ...prev, footer_caption: e.target.value }))
              }
            />
          </label>
        </div>
        <div className={styles.message} style={{ background: '#f3f4f6', color: '#374151' }}>
          Preview: Normal R100 → show <s>R121</s> <strong>R100</strong> ({displaySettings.badge_text}).
          Banner: “{displaySettings.banner_text}”
        </div>
        <button
          className={styles.saveBtn}
          onClick={saveDisplayDiscount}
          disabled={savingDisplay}
          style={{ marginTop: 12 }}
        >
          {savingDisplay ? 'Saving...' : 'Save display discount'}
        </button>
      </div>

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
