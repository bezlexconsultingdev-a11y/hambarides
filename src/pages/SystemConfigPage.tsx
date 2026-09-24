import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import styles from './SystemConfigPage.module.css';

interface ConfigItem {
  id: string;
  config_key: string;
  config_value: any;
  description: string;
  updated_at: string;
}

interface RegionPreset {
  id: string;
  name: string;
  kind: string;
  description?: string;
  radius_km?: number;
  enabled?: boolean;
}

export default function SystemConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pricing configuration
  const [baseFare, setBaseFare] = useState('15.00');
  const [perKmRate, setPerKmRate] = useState('8.50');
  const [perMinuteRate, setPerMinuteRate] = useState('2.00');
  const [minimumFare, setMinimumFare] = useState('25.00');
  const [commissionRate, setCommissionRate] = useState('20');
  const [surgePricingEnabled, setSurgePricingEnabled] = useState(false);
  const [surgeMultiplier, setSurgeMultiplier] = useState('1.5');

  // Operating regions
  const [regionCatalog, setRegionCatalog] = useState<RegionPreset[]>([]);
  const [enabledRegionIds, setEnabledRegionIds] = useState<string[]>(['gqeberha']);
  const [regionMessage, setRegionMessage] = useState('');

  // Business settings
  const [maxRideDistance, setMaxRideDistance] = useState('100');
  const [driverRadius, setDriverRadius] = useState('10');
  const [rideTimeout, setRideTimeout] = useState('300');
  const [cancellationFee, setCancellationFee] = useState('15.00');

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const [configRes, catalogRes] = await Promise.all([
        api.get('/admin/config').catch(() => ({ data: { configs: [] } })),
        api.get('/admin/operating-regions/catalog').catch(() => ({ data: null })),
      ]);

      const catalog = (catalogRes.data?.catalog || []) as RegionPreset[];
      setRegionCatalog(catalog);
      if (Array.isArray(catalogRes.data?.enabled_region_ids)) {
        setEnabledRegionIds(catalogRes.data.enabled_region_ids.map(String));
      }
      if (catalogRes.data?.message) {
        setRegionMessage(String(catalogRes.data.message));
      }

      const configData = configRes.data.configs || [];
      configData.forEach((config: ConfigItem) => {
        const value = config.config_value;
        switch (config.config_key) {
          case 'pricing':
            if (value.base_fare) setBaseFare(value.base_fare.toString());
            if (value.per_km_rate) setPerKmRate(value.per_km_rate.toString());
            if (value.per_minute_rate) setPerMinuteRate(value.per_minute_rate.toString());
            if (value.minimum_fare) setMinimumFare(value.minimum_fare.toString());
            if (value.surge_pricing_enabled !== undefined) setSurgePricingEnabled(value.surge_pricing_enabled);
            if (value.surge_multiplier) setSurgeMultiplier(value.surge_multiplier.toString());
            break;
          case 'commission':
            if (value.rate) setCommissionRate(value.rate.toString());
            break;
          case 'operating_regions':
            if (Array.isArray(value?.enabled_region_ids)) {
              setEnabledRegionIds(value.enabled_region_ids.map(String));
            }
            if (value?.message) setRegionMessage(String(value.message));
            break;
          case 'business_rules':
            if (value.max_ride_distance) setMaxRideDistance(value.max_ride_distance.toString());
            if (value.driver_search_radius) setDriverRadius(value.driver_search_radius.toString());
            if (value.ride_timeout_seconds) setRideTimeout(value.ride_timeout_seconds.toString());
            if (value.cancellation_fee) setCancellationFee(value.cancellation_fee.toString());
            break;
        }
      });

      if (!catalog.length) {
        // Fallback presets if backend not deployed yet
        setRegionCatalog([
          { id: 'za-all', name: 'All South Africa', kind: 'bbox', description: 'Nationwide' },
          {
            id: 'gqeberha',
            name: 'Port Elizabeth (Gqeberha)',
            kind: 'circle',
            description: 'Nelson Mandela Bay (~45 km)',
          },
          { id: 'johannesburg', name: 'Johannesburg', kind: 'circle', description: '~50 km' },
          { id: 'pretoria', name: 'Pretoria (Tshwane)', kind: 'circle', description: '~40 km' },
          { id: 'cape-town', name: 'Cape Town', kind: 'circle', description: '~50 km' },
          { id: 'durban', name: 'Durban', kind: 'circle', description: '~40 km' },
        ]);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  const toggleRegion = (id: string) => {
    setEnabledRegionIds((prev) => {
      if (id === 'za-all') {
        // Selecting nationwide clears city-only selections for clarity
        return prev.includes('za-all') ? [] : ['za-all'];
      }
      const withoutNation = prev.filter((x) => x !== 'za-all');
      if (withoutNation.includes(id)) {
        return withoutNation.filter((x) => x !== id);
      }
      return [...withoutNation, id];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const configUpdates = [
        {
          config_key: 'pricing',
          config_value: {
            base_fare: parseFloat(baseFare),
            per_km_rate: parseFloat(perKmRate),
            per_minute_rate: parseFloat(perMinuteRate),
            minimum_fare: parseFloat(minimumFare),
            surge_pricing_enabled: surgePricingEnabled,
            surge_multiplier: parseFloat(surgeMultiplier),
          },
          description: 'Ride pricing configuration',
        },
        {
          config_key: 'commission',
          config_value: {
            rate: parseFloat(commissionRate),
            driver_share: 100 - parseFloat(commissionRate),
          },
          description: 'Platform commission rate',
        },
        {
          config_key: 'operating_regions',
          config_value: {
            enabled_region_ids: enabledRegionIds,
            message: regionMessage.trim() || undefined,
          },
          description: 'Where rider booking and driver go-online are allowed',
        },
        {
          config_key: 'business_rules',
          config_value: {
            max_ride_distance: parseFloat(maxRideDistance),
            driver_search_radius: parseFloat(driverRadius),
            ride_timeout_seconds: parseInt(rideTimeout, 10),
            cancellation_fee: parseFloat(cancellationFee),
          },
          description: 'Business rules and limits',
        },
      ];

      await api.post('/admin/config/bulk-update', { configs: configUpdates });
      alert('Configuration saved successfully!');
      await loadConfigs();
    } catch (error: any) {
      console.error('Failed to save config:', error);
      alert(error.response?.data?.error || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading configuration...</div>;
  }

  const nationWide = enabledRegionIds.includes('za-all');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>System Configuration</h1>
        <p className={styles.subtitle}>Manage pricing, operating regions, and business rules</p>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h2>Operating regions</h2>
          <p className={styles.hint} style={{ marginBottom: 12 }}>
            Choose where the rider and driver apps may operate. Select <strong>All South Africa</strong> for
            nationwide, or one or more cities (e.g. Port Elizabeth only).
          </p>
          <div className={styles.regionGrid}>
            {regionCatalog.map((region) => {
              const checked = enabledRegionIds.includes(region.id);
              const disabledByNation = nationWide && region.id !== 'za-all';
              return (
                <label
                  key={region.id}
                  className={`${styles.regionCard} ${checked ? styles.regionCardOn : ''} ${
                    disabledByNation ? styles.regionCardDisabled : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabledByNation}
                    onChange={() => toggleRegion(region.id)}
                  />
                  <span>
                    <strong>{region.name}</strong>
                    <br />
                    <span className={styles.hint}>{region.description || region.kind}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className={styles.field} style={{ marginTop: 16 }}>
            <label>Rider / driver message (optional)</label>
            <input
              type="text"
              value={regionMessage}
              onChange={(e) => setRegionMessage(e.target.value)}
              className={styles.input}
              placeholder="Leave blank to auto-generate from selected regions"
            />
            <span className={styles.hint}>
              Shown when someone tries to book or go online outside the selected area.
            </span>
          </div>
          <p className={styles.hint}>
            Currently active:{' '}
            <strong>
              {enabledRegionIds.length
                ? regionCatalog
                    .filter((r) => enabledRegionIds.includes(r.id))
                    .map((r) => r.name)
                    .join(', ')
                : 'None (apps will block all trips)'}
            </strong>
          </p>
        </div>

        <div className={styles.section}>
          <h2>Pricing Configuration</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Base Fare (R)</label>
              <input
                type="number"
                step="0.01"
                value={baseFare}
                onChange={(e) => setBaseFare(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label>Per Kilometer Rate (R)</label>
              <input
                type="number"
                step="0.01"
                value={perKmRate}
                onChange={(e) => setPerKmRate(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label>Per Minute Rate (R)</label>
              <input
                type="number"
                step="0.01"
                value={perMinuteRate}
                onChange={(e) => setPerMinuteRate(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label>Minimum Fare (R)</label>
              <input
                type="number"
                step="0.01"
                value={minimumFare}
                onChange={(e) => setMinimumFare(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.surgeSection}>
            <div className={styles.checkboxField}>
              <input
                type="checkbox"
                id="surge"
                checked={surgePricingEnabled}
                onChange={(e) => setSurgePricingEnabled(e.target.checked)}
              />
              <label htmlFor="surge">Enable Surge Pricing</label>
            </div>
            {surgePricingEnabled && (
              <div className={styles.field}>
                <label>Surge Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  value={surgeMultiplier}
                  onChange={(e) => setSurgeMultiplier(e.target.value)}
                  className={styles.input}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Commission Configuration</h2>
          <div className={styles.field}>
            <label>Platform Commission Rate (%)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className={styles.input}
            />
            <span className={styles.hint}>
              Platform takes {commissionRate}%, Driver receives {100 - parseFloat(commissionRate || '0')}%
            </span>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Business Rules</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Max Ride Distance (km)</label>
              <input
                type="number"
                step="1"
                value={maxRideDistance}
                onChange={(e) => setMaxRideDistance(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label>Driver Search Radius (km)</label>
              <input
                type="number"
                step="1"
                value={driverRadius}
                onChange={(e) => setDriverRadius(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label>Ride Request Timeout (seconds)</label>
              <input
                type="number"
                step="1"
                value={rideTimeout}
                onChange={(e) => setRideTimeout(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label>Cancellation Fee (R)</label>
              <input
                type="number"
                step="0.01"
                value={cancellationFee}
                onChange={(e) => setCancellationFee(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Configuration'}
        </button>
      </div>
    </div>
  );
}
