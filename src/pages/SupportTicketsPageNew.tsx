import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, getStatusVariant } from '../lib/utils';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Eye, MessageCircle } from 'lucide-react';

interface Ticket {
  id: number;
  user_name: string;
  subject: string;
  category: 'account' | 'payment' | 'ride' | 'technical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

export default function SupportTicketsPageNew() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    const mockTickets: Ticket[] = [
      { id: 1, user_name: 'John Doe', subject: 'Payment issue', category: 'payment', priority: 'high', status: 'open', created_at: '2024-01-15T10:30:00Z' },
      { id: 2, user_name: 'Jane Smith', subject: 'Account verification', category: 'account', priority: 'medium', status: 'in_progress', created_at: '2024-01-20T14:20:00Z' },
      { id: 3, user_name: 'Bob Johnson', subject: 'Ride cancellation', category: 'ride', priority: 'urgent', status: 'open', created_at: '2024-02-01T09:15:00Z' },
    ];
    setTickets(mockTickets);
    setLoading(false);
  }, []);

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;

  const columns = [
    { key: 'id', label: 'Ticket ID', sortable: true },
    { key: 'user_name', label: 'User', sortable: true },
    { key: 'subject', label: 'Subject', sortable: true },
    { 
      key: 'category', 
      label: 'Category', 
      sortable: true,
      render: (ticket: Ticket) => (
        <StatusBadge 
          status={ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)} 
          variant="info"
          size="sm"
        />
      )
    },
    { 
      key: 'priority', 
      label: 'Priority', 
      sortable: true,
      render: (ticket: Ticket) => (
        <StatusBadge 
          status={ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} 
          variant={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'error' : ticket.priority === 'medium' ? 'warning' : 'default'}
          size="sm"
        />
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (ticket: Ticket) => (
        <StatusBadge 
          status={ticket.status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} 
          variant={getStatusVariant(ticket.status)}
          size="sm"
        />
      )
    },
    { 
      key: 'created_at', 
      label: 'Created', 
      sortable: true,
      render: (ticket: Ticket) => formatDateTime(ticket.created_at)
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
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage customer support requests</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
          + New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Open Tickets"
          value={openTickets}
          subtitle="Awaiting response"
          icon={<MessageSquare className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Urgent"
          value={urgentTickets}
          subtitle="Requires immediate attention"
          icon={<AlertCircle className="w-6 h-6" />}
          gradient="from-red-500 to-red-600"
        />
        <StatCard
          title="In Progress"
          value={tickets.filter(t => t.status === 'in_progress').length}
          subtitle="Being handled"
          icon={<Clock className="w-6 h-6" />}
          gradient="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Resolved"
          value={resolvedTickets}
          trend="+15.3%"
          trendDirection="up"
          subtitle="Successfully resolved"
          icon={<CheckCircle className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
        />
      </div>

      <div className="flex gap-2">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-green-100 text-green-700'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredTickets}
        searchable
        exportable
        pageSize={10}
        actions={() => (
          <div className="flex items-center gap-2">
            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
              <Eye className="w-4 h-4" />
            </button>
            <button className="p-1 text-green-600 hover:bg-green-50 rounded">
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}
