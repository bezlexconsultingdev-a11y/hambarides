import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, getStatusVariant } from '../lib/utils';
import { Users, UserCheck, Eye, Edit, Ban } from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'rider' | 'driver';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export default function UsersPageNew() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'rider' | 'driver'>('all');

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockUsers: User[] = [
      { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+27123456789', role: 'rider', status: 'active', created_at: '2024-01-15T10:30:00Z' },
      { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', phone: '+27987654321', role: 'driver', status: 'active', created_at: '2024-01-20T14:20:00Z' },
      { id: 3, first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com', phone: '+27555555555', role: 'rider', status: 'inactive', created_at: '2024-02-01T09:15:00Z' },
    ];
    setUsers(mockUsers);
    setLoading(false);
  }, []);

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);
  const activeUsers = users.filter(u => u.status === 'active').length;
  const riders = users.filter(u => u.role === 'rider').length;
  const drivers = users.filter(u => u.role === 'driver').length;

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true,
      render: (user: User) => `${user.first_name} ${user.last_name}`
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { 
      key: 'role', 
      label: 'Type', 
      sortable: true,
      render: (user: User) => (
        <StatusBadge 
          status={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
          variant={user.role === 'driver' ? 'info' : 'default'}
          size="sm"
        />
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (user: User) => (
        <StatusBadge 
          status={user.status.charAt(0).toUpperCase() + user.status.slice(1)} 
          variant={getStatusVariant(user.status)}
          size="sm"
        />
      )
    },
    { 
      key: 'created_at', 
      label: 'Joined', 
      sortable: true,
      render: (user: User) => formatDateTime(user.created_at)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage all riders and drivers</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
          + Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={users.length}
          trend="+12.5%"
          trendDirection="up"
          subtitle="All time"
          icon={<Users className="w-6 h-6" />}
          gradient="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Active Users"
          value={activeUsers}
          trend="+8.2%"
          trendDirection="up"
          subtitle="Currently active"
          icon={<UserCheck className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          title="Riders"
          value={riders}
          trend="+15.3%"
          trendDirection="up"
          subtitle="Total riders"
          icon={<Users className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Drivers"
          value={drivers}
          trend="+5.7%"
          trendDirection="up"
          subtitle="Total drivers"
          icon={<UserCheck className="w-6 h-6" />}
          gradient="from-amber-500 to-amber-600"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'rider', 'driver'] as const).map(f => (
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
            {f !== 'all' && ` (${users.filter(u => u.role === f).length})`}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        searchable
        exportable
        pageSize={10}
        onRowClick={(user) => navigate(`/users/${user.id}`)}
        actions={() => (
          <div className="flex items-center gap-2">
            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
              <Eye className="w-4 h-4" />
            </button>
            <button className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Edit className="w-4 h-4" />
            </button>
            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
              <Ban className="w-4 h-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}
