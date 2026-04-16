import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDateTime, getStatusVariant } from '../lib/utils';
import { CreditCard, Clock, CheckCircle, XCircle, Eye, Send } from 'lucide-react';

interface Payout {
  id: number;
  driver_name: string;
  amount: number;
  rides_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bank_account: string;
  created_at: string;
}

export default function PayoutsPageNew() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');

  useEffect(() => {
    const mockPayouts: Payout[] = [
      { id: 1, driver_name: 'Jane Smith', amount: 2450.50, rides_count: 45, status: 'pending', bank_account: '****1234', created_at: '2024-01-15T10:30:00Z' },
      { id: 2, driver_name: 'Mike Davis', amount: 1850.00, rides_count: 32, status: 'completed', bank_account: '****5678', created_at: '2024-01-20T14:20:00Z' },
      { id: 3, driver_name: 'Alice Brown', amount: 3200.75, rides_count: 58, status: 'processing', bank_account: '****9012', created_at: '2024-02-01T09:15:00Z' },
    ];
    setPayouts(mockPayouts);
    setLoading(false);
  }, []);

  const filteredPayouts = filter === 'all' ? payouts : payouts.filter(p => p.status === filter);
  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const completedPayouts = payouts.filter(p => p.status === 'completed').length;
  const failedPayouts = payouts.filter(p => p.status === 'failed').length;

  const columns = [
    { key: 'id', label: 'Payout ID', sortable: true },
    { key: 'driver_name', label: 'Driver', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (payout: Payout) => (
        <span className="font-semibold text-green-700">{formatCurrency(payout.amount)}</span>
      )
    },
    { key: 'rides_count', label: 'Rides', sortable: true },
    { key: 'bank_account', label: 'Bank Account', sortable: false },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (payout: Payout) => (
        <StatusBadge 
          status={payout.status.charAt(0).toUpperCase() + payout.status.slice(1)} 
          variant={getStatusVariant(payout.status)}
          size="sm"
        />
      )
    },
    { 
      key: 'created_at', 
      label: 'Date', 
      sortable: true,
      render: (payout: Payout) => formatDateTime(payout.created_at)
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
          <h1 className="text-3xl font-bold text-gray-900">Payouts Management</h1>
          <p className="text-gray-600 mt-1">Process driver payouts and earnings</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
          <Send className="w-4 h-4" />
          Process Pending
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(totalPending)}
          subtitle={`${pendingPayouts.length} drivers`}
          icon={<Clock className="w-6 h-6" />}
          gradient="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Total Payouts"
          value={payouts.length}
          trend="+12.5%"
          trendDirection="up"
          subtitle="All time"
          icon={<CreditCard className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Completed"
          value={completedPayouts}
          trend="+8.2%"
          trendDirection="up"
          subtitle="Successfully paid"
          icon={<CheckCircle className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          title="Failed"
          value={failedPayouts}
          trend="-2.1%"
          trendDirection="down"
          subtitle="Requires attention"
          icon={<XCircle className="w-6 h-6" />}
          gradient="from-red-500 to-red-600"
        />
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map(f => (
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
        data={filteredPayouts}
        searchable
        exportable
        pageSize={10}
        actions={(payout) => (
          <div className="flex items-center gap-2">
            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
              <Eye className="w-4 h-4" />
            </button>
            {payout.status === 'pending' && (
              <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}
