import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './SOSAlertsPage.css';

interface SOSAlert {
  id: number;
  ride_id: number;
  triggered_by: string;
  triggered_at: string;
  resolved_at?: string;
  status: 'active' | 'resolved' | 'false_alarm';
  recording_url?: string;
  location_logs?: Array<{ lat: number; lng: number; timestamp: string }>;
  admin_notes?: string;
  police_contacted: boolean;
  rider_name?: string;
  rider_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  pickup_address?: string;
  dropoff_address?: string;
}

export default function SOSAlertsPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAlerts();
    
    // Subscribe to real-time updates for active alerts
    const subscription = supabase
      .channel('sos_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts',
        },
        () => {
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sos_alerts')
        .select(`
          *,
          rides (
            pickup_address,
            dropoff_address,
            rider_id,
            driver_id
          )
        `)
        .order('triggered_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('status', 'active');
      } else if (filter === 'resolved') {
        query = query.in('status', ['resolved', 'false_alarm']);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get user details for each alert
      const alertsWithDetails = await Promise.all(
        (data || []).map(async (alert) => {
          const ride = alert.rides as any;
          
          // Get rider details
          const { data: riderData } = await supabase
            .from('users')
            .select('first_name, last_name, phone')
            .eq('id', alert.triggered_by)
            .single();

          // Get driver details if ride exists
          let driverData = null;
          if (ride?.driver_id) {
            const { data } = await supabase
              .from('users')
              .select('first_name, last_name, phone')
              .eq('id', ride.driver_id)
              .single();
            driverData = data;
          }

          return {
            ...alert,
            rider_name: riderData ? `${riderData.first_name} ${riderData.last_name}` : 'Unknown',
            rider_phone: riderData?.phone || '',
            driver_name: driverData ? `${driverData.first_name} ${driverData.last_name}` : 'N/A',
            driver_phone: driverData?.phone || '',
            pickup_address: ride?.pickup_address || '',
            dropoff_address: ride?.dropoff_address || '',
          };
        })
      );

      setAlerts(alertsWithDetails);
    } catch (error) {
      console.error('Error loading SOS alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (alertId: number, status: 'resolved' | 'false_alarm') => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({
          status,
          resolved_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', alertId);

      if (error) throw error;

      alert(`Alert marked as ${status}`);
      setSelectedAlert(null);
      setAdminNotes('');
      loadAlerts();
    } catch (error: any) {
      alert('Error updating alert: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const markPoliceContacted = async (alertId: number) => {
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({ police_contacted: true })
        .eq('id', alertId);

      if (error) throw error;

      loadAlerts();
    } catch (error: any) {
      alert('Error updating alert: ' + error.message);
    }
  };

  const getTimeSince = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getLatestLocation = (alert: SOSAlert) => {
    if (!alert.location_logs || alert.location_logs.length === 0) return null;
    return alert.location_logs[alert.location_logs.length - 1];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading SOS alerts...</p>
      </div>
    );
  }

  return (
    <div className="sos-alerts-page">
      <div className="page-header">
        <div>
          <h1>SOS Emergency Alerts</h1>
          <p className="subtitle">Monitor and manage emergency alerts from riders</p>
        </div>
        <div className="header-actions">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Alerts
            </button>
            <button
              className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({alerts.filter(a => a.status === 'active').length})
            </button>
            <button
              className={`filter-tab ${filter === 'resolved' ? 'active' : ''}`}
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚨</div>
          <h2>No SOS Alerts</h2>
          <p>
            {filter === 'active' 
              ? 'No active emergency alerts at this time.'
              : 'No emergency alerts found.'}
          </p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert) => {
            const latestLocation = getLatestLocation(alert);
            const isActive = alert.status === 'active';

            return (
              <div
                key={alert.id}
                className={`alert-card ${isActive ? 'alert-active' : ''}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="alert-header">
                  <div className="alert-status-badge">
                    {isActive && <span className="pulse-dot"></span>}
                    <span className={`status-text status-${alert.status}`}>
                      {alert.status === 'active' ? 'ACTIVE EMERGENCY' : alert.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="alert-time">{getTimeSince(alert.triggered_at)}</span>
                </div>

                <div className="alert-body">
                  <div className="alert-info-grid">
                    <div className="info-block">
                      <label>Rider</label>
                      <span className="info-value">{alert.rider_name}</span>
                      <span className="info-sub">{alert.rider_phone}</span>
                    </div>

                    <div className="info-block">
                      <label>Driver</label>
                      <span className="info-value">{alert.driver_name}</span>
                      <span className="info-sub">{alert.driver_phone}</span>
                    </div>

                    <div className="info-block">
                      <label>Ride #{alert.ride_id}</label>
                      <span className="info-value">{alert.pickup_address?.split(',')[0] || 'N/A'}</span>
                      <span className="info-sub">→ {alert.dropoff_address?.split(',')[0] || 'N/A'}</span>
                    </div>

                    <div className="info-block">
                      <label>Location Updates</label>
                      <span className="info-value">
                        {alert.location_logs?.length || 0} logs
                      </span>
                      {latestLocation && (
                        <a
                          href={`https://www.google.com/maps?q=${latestLocation.lat},${latestLocation.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View on Map
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="alert-features">
                    {alert.recording_url && (
                      <span className="feature-badge">
                        🎤 Audio Recording
                      </span>
                    )}
                    {alert.police_contacted && (
                      <span className="feature-badge">
                        👮 Police Contacted
                      </span>
                    )}
                  </div>
                </div>

                <div className="alert-footer">
                  <button className="btn-view">View Details →</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>SOS Alert #{selectedAlert.id}</h2>
                <span className={`status-badge status-${selectedAlert.status}`}>
                  {selectedAlert.status.toUpperCase()}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedAlert(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-section">
                  <h3>Rider Information</h3>
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedAlert.rider_name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <a href={`tel:${selectedAlert.rider_phone}`}>{selectedAlert.rider_phone}</a>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Driver Information</h3>
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedAlert.driver_name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <a href={`tel:${selectedAlert.driver_phone}`}>{selectedAlert.driver_phone}</a>
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h3>Ride Details</h3>
                  <div className="detail-item">
                    <label>Ride ID:</label>
                    <span>#{selectedAlert.ride_id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Pickup:</label>
                    <span>{selectedAlert.pickup_address || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Dropoff:</label>
                    <span>{selectedAlert.dropoff_address || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h3>Emergency Details</h3>
                  <div className="detail-item">
                    <label>Triggered:</label>
                    <span>{new Date(selectedAlert.triggered_at).toLocaleString()}</span>
                  </div>
                  {selectedAlert.resolved_at && (
                    <div className="detail-item">
                      <label>Resolved:</label>
                      <span>{new Date(selectedAlert.resolved_at).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>Police Contacted:</label>
                    <span>{selectedAlert.police_contacted ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {selectedAlert.recording_url && (
                  <div className="detail-section full-width">
                    <h3>Audio Recording</h3>
                    <audio controls src={selectedAlert.recording_url} className="audio-player">
                      Your browser does not support audio playback.
                    </audio>
                    <a
                      href={selectedAlert.recording_url}
                      download
                      className="download-link"
                    >
                      Download Recording
                    </a>
                  </div>
                )}

                {selectedAlert.location_logs && selectedAlert.location_logs.length > 0 && (
                  <div className="detail-section full-width">
                    <h3>Location History ({selectedAlert.location_logs.length} updates)</h3>
                    <div className="location-logs">
                      {selectedAlert.location_logs.slice(-10).reverse().map((log, index) => (
                        <div key={index} className="location-log-item">
                          <span className="log-time">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${log.lat},${log.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="log-coords"
                          >
                            {log.lat.toFixed(6)}, {log.lng.toFixed(6)}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAlert.status === 'active' && (
                  <div className="detail-section full-width">
                    <h3>Admin Actions</h3>
                    <div className="admin-actions">
                      {!selectedAlert.police_contacted && (
                        <button
                          className="btn btn-warning"
                          onClick={() => markPoliceContacted(selectedAlert.id)}
                        >
                          Mark Police Contacted
                        </button>
                      )}
                    </div>

                    <label htmlFor="admin-notes">Resolution Notes:</label>
                    <textarea
                      id="admin-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about the resolution..."
                      rows={4}
                    />

                    <div className="resolution-buttons">
                      <button
                        className="btn btn-success"
                        onClick={() => updateAlertStatus(selectedAlert.id, 'resolved')}
                        disabled={processing}
                      >
                        {processing ? 'Processing...' : 'Mark as Resolved'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => updateAlertStatus(selectedAlert.id, 'false_alarm')}
                        disabled={processing}
                      >
                        {processing ? 'Processing...' : 'Mark as False Alarm'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedAlert.admin_notes && (
                  <div className="detail-section full-width">
                    <h3>Admin Notes</h3>
                    <p className="admin-notes-text">{selectedAlert.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
