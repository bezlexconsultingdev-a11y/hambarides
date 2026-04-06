import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ActiveRide {
  id: number;
  rider_name: string;
  driver_name: string;
  status: string;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  driver_latitude?: number;
  driver_longitude?: number;
  created_at: string;
  fare: number;
}

interface DashboardStats {
  activeRides: number;
  driversOnline: number;
  todayRevenue: number;
  completedToday: number;
}

export default function OperationsDashboard() {
  const [activeRides, setActiveRides] = useState<ActiveRide[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeRides: 0,
    driversOnline: 0,
    todayRevenue: 0,
    completedToday: 0,
  });
  const [selectedRide, setSelectedRide] = useState<ActiveRide | null>(null);

  useEffect(() => {
    fetchActiveRides();
    fetchStats();

    // Subscribe to real-time updates
    const ridesChannel = supabase
      .channel('active-rides')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: 'status=in.("requested","accepted","in_progress")',
        },
        () => {
          fetchActiveRides();
          fetchStats();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchActiveRides();
      fetchStats();
    }, 10000); // Refresh every 10 seconds

    return () => {
      ridesChannel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const fetchActiveRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          id,
          status,
          pickup_latitude,
          pickup_longitude,
          destination_latitude,
          destination_longitude,
          driver_latitude,
          driver_longitude,
          created_at,
          fare,
          rider:users!rides_rider_id_fkey(name),
          driver:drivers!rides_driver_id_fkey(user:users(name))
        `)
        .in('status', ['requested', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRides = data?.map((ride: any) => ({
        id: ride.id,
        rider_name: ride.rider?.name || 'Unknown',
        driver_name: ride.driver?.user?.name || 'Unassigned',
        status: ride.status,
        pickup_latitude: ride.pickup_latitude,
        pickup_longitude: ride.pickup_longitude,
        destination_latitude: ride.destination_latitude,
        destination_longitude: ride.destination_longitude,
        driver_latitude: ride.driver_latitude,
        driver_longitude: ride.driver_longitude,
        created_at: ride.created_at,
        fare: ride.fare,
      })) || [];

      setActiveRides(formattedRides);
    } catch (error) {
      console.error('Error fetching active rides:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Active rides count
      const { count: activeCount } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .in('status', ['requested', 'accepted', 'in_progress']);

      // Drivers online
      const { count: driversCount } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);

      // Today's completed rides
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: completedRides } = await supabase
        .from('rides')
        .select('fare')
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      const revenue = completedRides?.reduce((sum, ride) => sum + (ride.fare || 0), 0) || 0;
      const completed = completedRides?.length || 0;

      setStats({
        activeRides: activeCount || 0,
        driversOnline: driversCount || 0,
        todayRevenue: revenue,
        completedToday: completed,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return '#FF9500';
      case 'accepted': return '#007AFF';
      case 'in_progress': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'requested': return 'Requested';
      case 'accepted': return 'Driver En Route';
      case 'in_progress': return 'In Progress';
      default: return status;
    }
  };

  return (
    <div className="operations-dashboard">
      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon active-rides">
            <i className="fas fa-car"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.activeRides}</div>
            <div className="stat-label">Active Rides</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon drivers-online">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.driversOnline}</div>
            <div className="stat-label">Drivers Online</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">R{stats.todayRevenue.toFixed(2)}</div>
            <div className="stat-label">Today's Revenue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.completedToday}</div>
            <div className="stat-label">Completed Today</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Live Map */}
        <div className="map-container">
          <MapContainer
            center={[-26.2041, 28.0473]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {activeRides.map((ride) => (
              <React.Fragment key={ride.id}>
                {/* Pickup Marker */}
                <Marker
                  position={[ride.pickup_latitude, ride.pickup_longitude]}
                  eventHandlers={{
                    click: () => setSelectedRide(ride),
                  }}
                >
                  <Popup>
                    <div className="ride-popup">
                      <strong>Pickup Location</strong>
                      <p>Ride #{ride.id}</p>
                      <p>Rider: {ride.rider_name}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Destination Marker */}
                <Marker
                  position={[ride.destination_latitude, ride.destination_longitude]}
                >
                  <Popup>
                    <div className="ride-popup">
                      <strong>Destination</strong>
                      <p>Ride #{ride.id}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Driver Location Marker */}
                {ride.driver_latitude && ride.driver_longitude && (
                  <Marker
                    position={[ride.driver_latitude, ride.driver_longitude]}
                  >
                    <Popup>
                      <div className="ride-popup">
                        <strong>Driver Location</strong>
                        <p>{ride.driver_name}</p>
                        <p>Status: {getStatusLabel(ride.status)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Route Line */}
                {ride.driver_latitude && ride.driver_longitude && (
                  <Polyline
                    positions={[
                      [ride.driver_latitude, ride.driver_longitude],
                      ride.status === 'accepted'
                        ? [ride.pickup_latitude, ride.pickup_longitude]
                        : [ride.destination_latitude, ride.destination_longitude],
                    ]}
                    color="#007749"
                    weight={3}
                    opacity={0.7}
                  />
                )}
              </React.Fragment>
            ))}
          </MapContainer>
        </div>

        {/* Active Rides List */}
        <div className="rides-list">
          <div className="rides-header">
            <h3>Active Rides</h3>
            <span className="rides-count">{activeRides.length}</span>
          </div>

          <div className="rides-scroll">
            {activeRides.length === 0 ? (
              <div className="no-rides">
                <i className="fas fa-inbox"></i>
                <p>No active rides</p>
              </div>
            ) : (
              activeRides.map((ride) => (
                <div
                  key={ride.id}
                  className={`ride-card ${selectedRide?.id === ride.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRide(ride)}
                >
                  <div className="ride-header">
                    <span className="ride-id">#{ride.id}</span>
                    <span
                      className="ride-status"
                      style={{ backgroundColor: getStatusColor(ride.status) }}
                    >
                      {getStatusLabel(ride.status)}
                    </span>
                  </div>

                  <div className="ride-info">
                    <div className="info-row">
                      <i className="fas fa-user"></i>
                      <span>{ride.rider_name}</span>
                    </div>
                    <div className="info-row">
                      <i className="fas fa-user-tie"></i>
                      <span>{ride.driver_name}</span>
                    </div>
                    <div className="info-row">
                      <i className="fas fa-money-bill"></i>
                      <span>R{ride.fare?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="info-row">
                      <i className="fas fa-clock"></i>
                      <span>{new Date(ride.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .operations-dashboard {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #1a1a1a;
          color: #fff;
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          padding: 20px;
          background: #2a2a2a;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 15px;
          background: #333;
          padding: 20px;
          border-radius: 12px;
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-icon.active-rides { background: #007749; }
        .stat-icon.drivers-online { background: #001489; }
        .stat-icon.revenue { background: #FFB81C; }
        .stat-icon.completed { background: #34C759; }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
        }

        .stat-label {
          font-size: 14px;
          color: #999;
        }

        .dashboard-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 20px;
          padding: 20px;
          overflow: hidden;
        }

        .map-container {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .rides-list {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .rides-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .rides-header h3 {
          margin: 0;
          font-size: 20px;
        }

        .rides-count {
          background: #007749;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .rides-scroll {
          flex: 1;
          overflow-y: auto;
        }

        .no-rides {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .no-rides i {
          font-size: 48px;
          margin-bottom: 10px;
        }

        .ride-card {
          background: #333;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ride-card:hover {
          background: #3a3a3a;
        }

        .ride-card.selected {
          background: #007749;
        }

        .ride-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .ride-id {
          font-weight: 700;
          font-size: 16px;
        }

        .ride-status {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .ride-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .info-row i {
          width: 16px;
          color: #999;
        }

        .ride-popup {
          font-family: system-ui;
        }

        .ride-popup strong {
          display: block;
          margin-bottom: 5px;
        }

        .ride-popup p {
          margin: 2px 0;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
