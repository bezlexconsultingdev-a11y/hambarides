import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDateTime, getStatusVariant } from '../lib/utils';
import { Car, Activity, CheckCircle, XCircle, Eye, MapPin } from 'lucide-react';

interface Ride {
  id: number;
  rider_name: string;
  driver_name: string;
  pickup: string;
  dropoff: string;
  fare: number;
  status: 'completed' | 'active' | 'cancelled' | 'pending';
  created_at: string;
}

export default function RidesPageNew() {
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'active' | 'cancelled' | 'pending'>('all');

  useEffect(() => {
    const mockRides: Ride[] = [
      { id: 1, rider_name: 'John Doe', driver_name: 'Jane Smith', pickup: 'Sandton', dropoff: 'Rosebank', fare: 85.50, status: 'completed', created_at: '2024-01-15T10:30:00Z' },
      { id: 2, rider_name: 'Bob Johnson', driver_name: 'Alice Brown', pickup: 'Johannesburg', dropoff: 'Pretoria', fare: 250.00, status: 'active', created_at: '2024-01-20T14:20:00Z' },
      { id: 3, rider_name: 'Sarah Wilson', driver_name: 'Mike Davis', pickup: 'Midrand', dropoff: 'Centurion', fare: 120.00, status: 'pending', created_at: '2024-02-01T09:15:00Z' },
    ];
    setRides(mockRides);
    setLoading(false);
  }, []);

  const filteredRides = filter === 'all' ? rides : rides.filter(r => r.status === filter);
  const completedRides = rides.filter(r => r.status === 'completed').length;
  const activeRides = rides.filter(r => r.status === 'active').length;
  const cancelledRides = rides.filter(r => r.status === 'cancelled').length;

  const columns = [
    { key: 'id', label: 'Ride ID', sortable: true },
    { key: 'rider_name', label: 'Rider', sortable: true },
    { key: 'driver_name', label: 'Driver', sortable: true },
    { 
      key: 'route', 
      label: 'Route', 
      render: (ride: Ride) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-700">{ride.pickup}</span>
          <span className="text-gray-400">→</span>
          <span className="text-gray-700">{ride.dropoff}</span>
        </div>
      )
    },
    { 
      key: 'fare', 
      label: 'Fare', 
      sortable: true,
      render: (ride: Ride) => formatCurrency(ride.fare)
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (ride: Ride) => (
        <StatusBadge 
          status={ride.status.charAt(0).toUpperCase() + ride.status.slice(1)} 
          variant={getStatusVariant(ride.status)}
          size="sm"
        />
      )
    },
    { 
      key: 'created_at', 
      label: 'Date', 
      sortable: true,
      render: (ride: Ride) => formatDateTime(ride.created_at)
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rides Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all rides</p>
        </div>
        <button 
          onClick={() => navigate('/rides/active')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          View Live Map
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Rides"
          value={rides.length}
          trend="+5.4%"
          trendDirection="up"
          subtitle="All time"
          icon={<Car className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Completed"
          value={completedRides}
          trend="+8.2%"
          trendDirection="up"
          subtitle="Successfully completed"
          icon={<CheckCircle className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          title="Active Now"
          value={activeRides}
          subtitle="Currently in progress"
          icon={<Activity className="w-6 h-6" />}
          gradient="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Cancelled"
          value={cancelledRides}
          trend="-2.1%"
          trendDirection="down"
          subtitle="Total cancelled"
          icon={<XCircle className="w-6 h-6" />}
          gradient="from-red-500 to-red-600"
        />
      </div>

      <div className="flex gap-2">
        {(['all', 'completed', 'active', 'pending', 'cancelled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-green-100 text-green-700'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredRides}
        searchable
        exportable
        pageSize={10}
        onRowClick={(ride) => navigate(`/rides/${ride.id}`)}
        actions={() => (
          <div className="flex items-center gap-2">
            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
              <Eye className="w-4 h-4" />
            </button>
            <button className="p-1 text-green-600 hover:bg-green-50 rounded">
              <MapPin className="w-4 h-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}
