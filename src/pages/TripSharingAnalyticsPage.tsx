import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './TripSharingAnalyticsPage.css';

interface TripShare {
  id: string;
  ride_id: number;
  rider_id: string;
  share_token: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  view_count: number;
  rider_name?: string;
  pickup_address?: string;
  dropoff_address?: string;
  ride_status?: string;
}

interface Analytics {
  total_shares: number;
  active_shares: number;
  total_views: number;
  average_views_per_share: number;
  shares_today: number;
  shares_this_week: number;
}

export default function TripSharingAnalyticsPage() {
  const [shares, setShares] = useState<TripShare[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_shares: 0,
    active_shares: 0,
    total_views: 0,
    average_views_per_share: 0,
    shares_today: 0,
    shares_this_week: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load trip shares
      let query = supabase
        .from('trip_shares')
        .select(`
          *,
          rides (
            pickup_address,
            dropoff_address,
            status,
            rider_id
          )
        `)
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'expired') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get rider details for each share
      const sharesWithDetails = await Promise.all(
        (data || []).map(async (share) => {
          const ride = share.rides as any;
          
          const { data: riderData } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', share.rider_id)
            .single();

          return {
            ...share,
            rider_name: riderData ? `${riderData.first_name} ${riderData.last_name}` : 'Unknown',
            pickup_address: ride?.pickup_address || '',
            dropoff_address: ride?.dropoff_address || '',
            ride_status: ride?.status || '',
          };
        })
      );

      setShares(sharesWithDetails);

      // Calculate analytics
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalViews = sharesWithDetails.reduce((sum, s) => sum + (s.view_count || 0), 0);
      const activeCount = sharesWithDetails.filter(s => s.is_active).length;
      const todayCount = sharesWithDetails.filter(
        s => new Date(s.created_at) >= today
      ).length;
      const weekCount = sharesWithDetails.filter(
        s => new Date(s.created_at) >= weekAgo
      ).length;

      setAnalytics({
        total_shares: sharesWithDetails.length,
        active_shares: activeCount,
        total_views: totalViews,
        average_views_per_share: sharesWithDetails.length > 0 
          ? Math.round(totalViews / sharesWithDetails.length) 
          : 0,
        shares_today: todayCount,
        shares_this_week: weekCount,
      });
    } catch (error) {
      console.error('Error loading trip sharing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deactivateShare = async (shareId: string) => {
    if (!confirm('Deactivate this trip share?')) return;

    try {
      const { error } = await supabase
        .from('trip_shares')
        .update({ is_active: false })
        .eq('id', shareId);

      if (error) throw error;

      alert('Trip share deactivated');
      loadData();
    } catch (error: any) {
      alert('Error deactivating share: ' + error.message);
    }
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/track/${token}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
  };

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/track/${token}`;
  };

  const isExpired = (share: TripShare): boolean => {
    if (!share.expires_at) return false;
    return new Date(share.expires_at) < new Date();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Trip Sharing Analytics</h1>
          <p className="subtitle">Monitor live trip sharing usage and engagement</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-icon">🔗</div>
          <div className="card-content">
            <h3>Total Shares</h3>
            <p className="card-value">{analytics.total_shares}</p>
            <p className="card-detail">All time</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Active Shares</h3>
            <p className="card-value">{analytics.active_shares}</p>
            <p className="card-detail">Currently active</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">👁️</div>
          <div className="card-content">
            <h3>Total Views</h3>
            <p className="card-value">{analytics.total_views}</p>
            <p className="card-detail">Avg {analytics.average_views_per_share} per share</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>This Week</h3>
            <p className="card-value">{analytics.shares_this_week}</p>
            <p className="card-detail">{analytics.shares_today} today</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-section">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Shares
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-tab ${filter === 'expired' ? 'active' : ''}`}
            onClick={() => setFilter('expired')}
          >
            Expired
          </button>
        </div>
      </div>

      {/* Shares List */}
      {shares.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>No Trip Shares</h2>
          <p>No trip sharing data available for the selected filter.</p>
        </div>
      ) : (
        <div className="shares-table-container">
          <table className="shares-table">
            <thead>
              <tr>
                <th>Ride ID</th>
                <th>Rider</th>
                <th>Route</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Views</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share) => {
                const expired = isExpired(share);
                const statusClass = share.is_active && !expired ? 'active' : 'inactive';

                return (
                  <tr key={share.id}>
                    <td>#{share.ride_id}</td>
                    <td>{share.rider_name}</td>
                    <td className="route-cell">
                      <div className="route-info">
                        <span className="route-from">{share.pickup_address?.split(',')[0] || 'N/A'}</span>
                        <span className="route-arrow">→</span>
                        <span className="route-to">{share.dropoff_address?.split(',')[0] || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{new Date(share.created_at).toLocaleDateString()}</td>
                    <td>
                      {share.expires_at 
                        ? new Date(share.expires_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <span className="view-count">{share.view_count || 0}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-${statusClass}`}>
                        {share.is_active && !expired ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => copyShareLink(share.share_token)}
                          title="Copy link"
                        >
                          📋
                        </button>
                        <a
                          href={getShareUrl(share.share_token)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon"
                          title="View"
                        >
                          👁️
                        </a>
                        {share.is_active && !expired && (
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => deactivateShare(share.id)}
                            title="Deactivate"
                          >
                            🚫
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
