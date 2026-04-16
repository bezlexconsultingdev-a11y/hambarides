import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/admin';
import type { DashboardStats } from '../api/admin';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatRelativeTime, getStatusVariant } from '../lib/utils';
import { 
  DollarSign, 
  Car, 
  Users, 
  TrendingUp,
  AlertTriangle,
  FileText,
  MessageSquare,
  Eye
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function DashboardPageNew() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    getDashboard()
      .then((d) => setStats(d.stats))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Mock data for charts (replace with real data from API)
  const revenueData = [
    { date: 'Jan 1', revenue: 12000 },
    { date: 'Jan 5', revenue: 15000 },
    { date: 'Jan 10', revenue: 18000 },
    { date: 'Jan 15', revenue: 16000 },
    { date: 'Jan 20', revenue: 22000 },
    { date: 'Jan 25', revenue: 25000 },
    { date: 'Jan 30', revenue: 28000 },
  ];

  const rideDistribution = [
    { name: 'Completed', value: stats.completedRides, color: '#007749' },
    { name: 'Active', value: 89, color: '#3B82F6' },
    { name: 'Cancelled', value: 45, color: '#E03C31' },
    { name: 'Pending', value: stats.pendingRides, color: '#FFB81C' },
  ];

  const recentActivity = [
    { id: 1, type: 'Ride', description: 'John → Sandton', status: 'Completed', time: '2m ago' },
    { id: 2, type: 'User', description: 'New rider signup', status: 'New', time: '5m ago' },
    { id: 3, type: 'Payout', description: 'Driver #234 paid R450', status: 'Sent', time: '8m ago' },
    { id: 4, type: 'SOS', description: 'Alert resolved', status: 'Resolved', time: '12m ago' },
    { id: 5, type: 'Ticket', description: 'Support #567 opened', status: 'Open', time: '15m ago' },
  ];

  const sparklineData = [12, 15, 13, 18, 16, 20, 22];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Hero Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          trend="+8.2%"
          trendDirection="up"
          subtitle="vs last period"
          icon={<DollarSign className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
          sparklineData={sparklineData}
          onClick={() => navigate('/financial-analytics')}
        />
        <StatCard
          title="Total Rides"
          value={stats.totalRides.toLocaleString()}
          trend="+5.4%"
          trendDirection="up"
          subtitle="89 active now"
          icon={<Car className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
          sparklineData={[100, 120, 115, 130, 125, 140, 150]}
          onClick={() => navigate('/rides')}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          trend="+12.5%"
          trendDirection="up"
          subtitle={`${stats.totalRiders} riders, ${stats.totalDrivers} drivers`}
          icon={<Users className="w-6 h-6" />}
          gradient="from-purple-500 to-purple-600"
          sparklineData={[50, 55, 52, 60, 58, 65, 70]}
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Growth Rate"
          value="+12.5%"
          trend="This week"
          trendDirection="up"
          subtitle="Week over week"
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-amber-500 to-amber-600"
          sparklineData={[5, 8, 6, 10, 9, 12, 12.5]}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
              <p className="text-sm text-gray-500">Last 30 days</p>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007749" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#007749" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#007749"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ride Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Ride Distribution</h2>
            <p className="text-sm text-gray-500">By status</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={rideDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {rideDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-sm text-gray-700">
                    {value}: {entry.payload.value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          title="SOS Alerts"
          count={2}
          subtitle="Last: 5m ago"
          icon={<AlertTriangle className="w-6 h-6" />}
          onClick={() => navigate('/sos-alerts')}
          urgent={true}
          color="red"
        />
        <QuickActionCard
          title="Pending Applications"
          count={15}
          subtitle="Oldest: 2d ago"
          icon={<FileText className="w-6 h-6" />}
          onClick={() => navigate('/driver-applications')}
          color="amber"
        />
        <QuickActionCard
          title="Support Tickets"
          count={8}
          subtitle="Urgent: 3"
          icon={<MessageSquare className="w-6 h-6" />}
          onClick={() => navigate('/support-tickets')}
          color="blue"
        />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-500">Latest updates across the platform</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 rounded-lg transition-colors">
              View All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {activity.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={activity.status}
                      variant={getStatusVariant(activity.status)}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
