import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import styles from './DisputesPage.module.css';

interface Dispute {
  id: string;
  ride_id: string;
  reported_by: string;
  reporter_name: string;
  reporter_type: string;
  dispute_type: string;
  description: string;
  status: string;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  ride_pickup: string;
  ride_dropoff: string;
  ride_fare: number;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadDisputes();
  }, [statusFilter]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await adminApi.get(`/disputes?${params.toString()}`);
      setDisputes(response.data.disputes);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolution.trim()) {
      alert('Please enter a resolution');
      return;
    }

    try {
      setResolving(true);
      await adminApi.post(`/disputes/${selectedDispute.id}/resolve`, {
        resolution,
        status: 'resolved'
      });
      alert('Dispute resolved successfully');
      setSelectedDispute(null);
      setResolution('');
      await loadDisputes();
    } catch (error: any) {
      console.error('Failed to resolve dispute:', error);
      alert(error.response?.data?.error || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  const handleDismiss = async () => {
    if (!selectedDispute) return;

    if (!confirm('Are you sure you want to dismiss this dispute?')) return;

    try {
      setResolving(true);
      await adminApi.post(`/disputes/${selectedDispute.id}/resolve`, {
        resolution: 'Dispute dismissed - no action required',
        status: 'dismissed'
      });
      alert('Dispute dismissed');
      setSelectedDispute(null);
      await loadDisputes();
    } catch (error: any) {
      console.error('Failed to dismiss dispute:', error);
      alert(error.response?.data?.error || 'Failed to dismiss dispute');
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'under_review': return '#007bff';
      case 'resolved': return '#28a745';
      case 'dismissed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'fare_dispute': 'Fare Dispute',
      'driver_behavior': 'Driver Behavior',
      'rider_behavior': 'Rider Behavior',
      'route_issue': 'Route Issue',
      'payment_issue': 'Payment Issue',
      'safety_concern': 'Safety Concern',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className={styles.loading}>Loading disputes...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Ride Disputes</h1>
          <p className={styles.subtitle}>Manage and resolve ride disputes</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Disputes</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <div className={styles.content}>
        <div className={styles.disputesList}>
          {disputes.length === 0 ? (
            <div className={styles.emptyState}>No disputes found</div>
          ) : (
            disputes.map((dispute) => (
              <div
                key={dispute.id}
                className={`${styles.disputeCard} ${selectedDispute?.id === dispute.id ? styles.disputeCardActive : ''}`}
                onClick={() => setSelectedDispute(dispute)}
              >
                <div className={styles.disputeHeader}>
                  <span
                    className={styles.statusBadge}
                    style={{ background: getStatusColor(dispute.status) }}
                  >
                    {dispute.status.replace('_', ' ')}
                  </span>
                  <span className={styles.disputeType}>
                    {getDisputeTypeLabel(dispute.dispute_type)}
                  </span>
                </div>
                <div className={styles.disputeReporter}>
                  Reported by: <strong>{dispute.reporter_name}</strong> ({dispute.reporter_type})
                </div>
                <div className={styles.disputeDescription}>
                  {dispute.description.substring(0, 100)}
                  {dispute.description.length > 100 && '...'}
                </div>
                <div className={styles.disputeRide}>
                  <div className={styles.rideRoute}>
                    {dispute.ride_pickup} → {dispute.ride_dropoff}
                  </div>
                  <div className={styles.rideFare}>R {dispute.ride_fare.toFixed(2)}</div>
                </div>
                <div className={styles.disputeFooter}>
                  {formatDate(dispute.created_at)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.disputeDetails}>
          {selectedDispute ? (
            <>
              <div className={styles.detailsHeader}>
                <h2>Dispute Details</h2>
                <span
                  className={styles.statusBadge}
                  style={{ background: getStatusColor(selectedDispute.status) }}
                >
                  {selectedDispute.status.replace('_', ' ')}
                </span>
              </div>

              <div className={styles.detailsBody}>
                <div className={styles.section}>
                  <h3>Dispute Information</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Type:</span>
                      <span>{getDisputeTypeLabel(selectedDispute.dispute_type)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Reported By:</span>
                      <span>{selectedDispute.reporter_name} ({selectedDispute.reporter_type})</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Reported:</span>
                      <span>{formatDate(selectedDispute.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Ride Information</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Pickup:</span>
                      <span>{selectedDispute.ride_pickup}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Dropoff:</span>
                      <span>{selectedDispute.ride_dropoff}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Fare:</span>
                      <span>R {selectedDispute.ride_fare.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Description</h3>
                  <div className={styles.descriptionBox}>
                    {selectedDispute.description}
                  </div>
                </div>

                {selectedDispute.resolution && (
                  <div className={styles.section}>
                    <h3>Resolution</h3>
                    <div className={styles.resolutionBox}>
                      {selectedDispute.resolution}
                    </div>
                    {selectedDispute.resolved_at && (
                      <div className={styles.resolvedInfo}>
                        Resolved on {formatDate(selectedDispute.resolved_at)}
                      </div>
                    )}
                  </div>
                )}

                {selectedDispute.status === 'pending' || selectedDispute.status === 'under_review' ? (
                  <div className={styles.section}>
                    <h3>Resolve Dispute</h3>
                    <textarea
                      className={styles.textarea}
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Enter resolution details..."
                      rows={5}
                    />
                    <div className={styles.actions}>
                      <button
                        className={styles.dismissButton}
                        onClick={handleDismiss}
                        disabled={resolving}
                      >
                        Dismiss
                      </button>
                      <button
                        className={styles.resolveButton}
                        onClick={handleResolve}
                        disabled={resolving || !resolution.trim()}
                      >
                        {resolving ? 'Resolving...' : 'Resolve Dispute'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              Select a dispute to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
