import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, getStatusVariant } from '../lib/utils';
import { AlertTriangle, Phone, MapPin, CheckCircle, Eye } from 'lucide-react';

interface SOSAlert {
  id: number;
  user_name: string;
  user_type: 'rider' | 'driver';
  location: string;
  status: 'active' | 'resolved' | 'false_alarm';
  created_at: string;
  resolved_at?: string;
}

export default function SOSAlertsPageNew() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockAlerts: SOSAlert[] = [
      { id: 1, user_name: 'John Doe', user_type: 'rider', location: 'Sandton, Johannesburg', status: 'active', created_at: '2024-01-15T10:30:00Z' },
      { id: 2, user_name: 'Jane Smith', user_type: 'driver', location: 'Rosebank, Johannesburg', status: 'resolved', created_at: '2024-01-20T14:20:00Z', resolved_at: '2024-01-20T14:45:00Z' },
    ];
    setAlerts(mockAlerts);
    setLoading(false);
  }, []);

  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;

  const columns = [
    { key: 'id', label: 'Alert ID', sortable: true },
    { key: 'user_name', label: 'User', sortable: true },
    { 
      key: 'user_type', 
      label: 'Type', 
      sortable: true,
      render: (alert: SOSAlert) => (
        <StatusBadge 
          status={alert.user_type.charAt(0).toUpperCase() + alert.user_type.slice(1)} 
          variant={alert.user_type === 'driver' ? 'info' : 'default'}
          size="sm"
        />
      )
    },
    { key: 'location', label: 'Location', sortable: false },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (alert: SOSAlert) => (
        <StatusBadge 
          status={alert.status === 'false_alarm' ? 'False Alarm' : alert.status.charAt(0).toUpperCase() + alert.status.slice(1)} 
          variant={alert.status === 'active' ? 'error' : getStatusVariant(alert.status)}
          size="sm"
        />
      )
    },
    { 
      key: 'created_at', 
      label: 'Time', 
      sortable: true,
      render: (alert: SOSAlert) => formatDateTime(alert.created_at)
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
          <h1 className="text-3xl font-bold text-gray-900">SOS Alerts</h1>
          <p className="text-gray-600 mt-1">Emergency alerts and safety monitoring</p>
        </div>
        {activeAlerts > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            {activeAlerts} Active Alert{activeAlerts > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Active Alerts"
          value={activeAlerts}
          subtitle="Requires immediate action"
          icon={<AlertTriangle className="w-6 h-6" />}
          gradient="from-red-500 to-red-600"
        />
        <StatCard
          title="Resolved Today"
          value={resolvedAlerts}
          subtitle="Successfully handled"
          icon={<CheckCircle className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          title="Total Alerts"
          value={alerts.length}
          trend="-15.3%"
          trendDirection="down"
          subtitle="All time"
          icon={<AlertTriangle className="w-6 h-6" />}
          gradient="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Avg Response Time"
          value="3.5 min"
          trend="-12%"
          trendDirection="down"
          subtitle="Faster response"
          icon={<Phone className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
        />
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        searchable
        exportable
        pageSize={10}
        actions={(alert) => (
          <div className="flex items-center gap-2">
            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
              <Eye className="w-4 h-4" />
            </button>
            <button className="p-1 text-green-600 hover:bg-green-50 rounded">
              <MapPin className="w-4 h-4" />
            </button>
            {alert.status === 'active' && (
              <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                <Phone className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}
