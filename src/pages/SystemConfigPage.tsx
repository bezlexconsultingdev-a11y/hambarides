import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import styles from './SystemConfigPage.module.css';

interface ConfigItem {
  id: string;
  config_key: string;
  config_value: any;
  description: string;
  updated_at: string;
}

export default function SystemConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  
  // Pricing configuration
  const [baseFare, setBaseFare] = useState('15.00');
  const [perKmRate, setPerKmRate] = useState('8.50');
  const [perMinuteRate, setPerMinuteRate] = useState('2.00');
  const [minimumFare, setMinimumFare] = useState('25.00');
  const [commissionRate, setCommissionRate] = useState('20');
  const [surgePricingEnabled, setSurgePricingEnabled] = useState(false);
  const [surgeMultiplier, setSurgeMultiplier] = useState('1.5');
  
  // Service areas
  const [serviceAreas, setServiceAreas] = useState('Johannesburg, Pretoria, Cape Town, Durban');
  
  // Business settings
  const [maxRideDistance, setMaxRideDistance] = useState('100');
  const [driverRadius, setDriverRadius] = useState('10');
  const [rideTimeout, setRideTimeout] = useState('300');
  const [cancellationFee, setCancellationFee] = useState('15.00');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get('/config');
      const configData = response.data.configs || [];
      setConfigs(configData);
      
      // Parse and set values
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
          case 'service_areas':
            if (value.areas) setServiceAreas(value.areas.join(', '));
            break;
          case 'business_rules':
            if (value.max_ride_distance) setMaxRideDistance(value.max_ride_distance.toString());
            if (value.driver_search_radius) setDriverRadius(value.driver_search_radius.toString());
            if (value.ride_timeout_seconds) setRideTimeout(value.ride_timeout_seconds.toString());
            if (value.cancellation_fee) setCancellationFee(value.cancellation_fee.toString());
            break;
        }
      });
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
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
          description: 'Ride pricing configuration'
        },
        {
          config_key: 'commission',
          config_value: {
            rate: parseFloat(commissionRate),
            driver_share: 100 - parseFloat(commissionRate),
          },
          description: 'Platform commission rate'
        },
        {
          config_key: 'service_areas',
          config_value: {
            areas: serviceAreas.split(',').map(a => a.trim()).filter(a => a),
          },
          description: 'Active service areas'
        },
        {
          config_key: 'business_rules',
          config_value: {
            max_ride_distance: parseFloat(maxRideDistance),
            driver_search_radius: parseFloat(driverRadius),
            ride_timeout_seconds: parseInt(rideTimeout),
            cancellation_fee: parseFloat(cancellationFee),
          },
          description: 'Business rules and limits'
        }
      ];

      await adminApi.post('/config/bulk-update', { configs: configUpdates });
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>System Configuration</h1>
        <p className={styles.subtitle}>Manage pricing, service areas, and business rules</p>
      </div>

      <div className={styles.sections}>
        {/* Pricing Configuration */}
        <div className={styles.section}>
          <h2>💰 Pricing Configuration</h2>
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
              <span className={styles.hint}>Initial charge when ride starts</span>
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
              <span className={styles.hint}>Charge per kilometer traveled</span>
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
              <span className={styles.hint}>Charge per minute of ride time</span>
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
              <span className={styles.hint}>Minimum charge for any ride</span>
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
                <span className={styles.hint}>Multiply base rates during high demand</span>
              </div>
            )}
          </div>
        </div>

        {/* Commission Configuration */}
        <div className={styles.section}>
          <h2>📊 Commission Configuration</h2>
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
              Platform takes {commissionRate}%, Driver receives {100 - parseFloat(commissionRate)}%
            </span>
          </div>
        </div>

        {/* Service Areas */}
        <div className={styles.section}>
          <h2>📍 Service Areas</h2>
          <div className={styles.field}>
            <label>Active Service Areas</label>
            <textarea
              value={serviceAreas}
              onChange={(e) => setServiceAreas(e.target.value)}
              className={styles.textarea}
              rows={3}
              placeholder="Enter cities separated by commas"
            />
            <span className={styles.hint}>Comma-separated list of cities where service is available</span>
          </div>
        </div>

        {/* Business Rules */}
        <div className={styles.section}>
          <h2>⚙️ Business Rules</h2>
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
              <span className={styles.hint}>Maximum allowed ride distance</span>
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
              <span className={styles.hint}>Radius to search for available drivers</span>
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
              <span className={styles.hint}>Time before ride request expires</span>
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
              <span className={styles.hint}>Fee charged for late cancellations</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All Configuration'}
        </button>
      </div>
    </div>
  );
}
