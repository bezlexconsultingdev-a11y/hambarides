import { useState, useEffect } from 'react';
import { Bell, Send, History, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { api } from '../api/client';
import { getUsers } from '../api/admin';

interface NotificationHistory {
  id: string;
  user_type: string;
  title: string;
  body: string;
  sent_count: number;
  created_at: string;
}

export default function Notifications() {
  const [tab, setTab] = useState<'send' | 'history'>('send');
  const [targetMode, setTargetMode] = useState<'broadcast' | 'single'>('broadcast');
  const [userType, setUserType] = useState<'rider' | 'driver' | 'all'>('rider');
  const [targetUserId, setTargetUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; label: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (tab === 'history') {
      fetchHistory();
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== 'send' || targetMode !== 'single' || users.length > 0 || usersLoading) return;
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const response = await getUsers({ limit: 500, offset: 0 });
        const mapped = (response.users ?? []).map((u) => {
          const firstName = String(u.first_name ?? '').trim();
          const lastName = String(u.last_name ?? '').trim();
          const fullName = `${firstName} ${lastName}`.trim() || 'Unknown user';
          const email = String(u.email ?? '').trim();
          const phone = String(u.phone ?? '').trim();
          const details = [email, phone].filter(Boolean).join(' | ');
          return {
            id: String(u.id),
            label: `${fullName}${details ? ` (${details})` : ''}`,
          };
        });
        setUsers(mapped);
      } catch (err) {
        console.error('Failed to load users for notification picker:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    void loadUsers();
  }, [tab, targetMode, users.length, usersLoading]);

  useEffect(() => {
    if (targetMode !== 'single') return;
    const raw = userSearch.trim();
    if (!raw) {
      setTargetUserId('');
      return;
    }
    const exact = users.find((u) => u.id === raw || u.label === raw);
    if (exact) {
      setTargetUserId(exact.id);
      return;
    }
    const match = raw.match(/^(\d+)\s*[-:|]/);
    if (match?.[1]) {
      setTargetUserId(match[1]);
    } else {
      setTargetUserId(raw);
    }
  }, [targetMode, userSearch, users]);

  const fetchHistory = async () => {
    setHistoryError('');
    try {
      const response = await api.get('/notifications/history');
      setHistory(response.data.history ?? []);
    } catch (err) {
      console.error('Error fetching history:', err);
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.response?.data?.error || err.message
        : 'Failed to load history';
      setHistoryError(String(msg));
      setHistory([]);
    }
  };

  const handleSendNotification = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (targetMode === 'single') {
        const cleanUserId = targetUserId.trim();
        if (!cleanUserId) {
          setLoading(false);
          setError('Please enter a user ID');
          return;
        }
        const idempotencyKey = `admin-single-${cleanUserId}-${Date.now()}-${title.trim().slice(0, 24)}`;
        response = await api.post('/notifications/send', {
          userId: cleanUserId,
          title: cleanTitle,
          body: cleanBody,
          idempotencyKey,
        });
      } else {
        const idempotencyKey = `admin-${userType}-${Date.now()}-${title.trim().slice(0, 24)}`;
        response = await api.post('/notifications/broadcast', {
          userType,
          title: cleanTitle,
          body: cleanBody,
          idempotencyKey,
        });
      }
      const sentCount =
        response.data?.sentCount ??
        response.data?.sent_count ??
        response.data?.count ??
        0;
      const failedCount = response.data?.failedCount ?? response.data?.failed_count ?? 0;
      const invalidatedCount = response.data?.invalidatedCount ?? response.data?.invalidated_count ?? 0;
      const duplicate = Boolean(response.data?.duplicate);
      const serverMessage = String(response.data?.message || '').trim();
      const audienceLabel = targetMode === 'single' ? `user ${targetUserId.trim()}` : userType;

      if (duplicate) {
        setSuccess(
          serverMessage ||
            `This notification was already sent earlier (idempotency). Last count: ${sentCount} for ${audienceLabel}.`
        );
      } else {
        setSuccess(
          serverMessage ||
            `Notification request completed. Sent: ${sentCount}, Failed: ${failedCount}, Invalid tokens removed: ${invalidatedCount}.`
        );
      }
      setTitle('');
      setBody('');
      setTargetUserId('');
      setUserSearch('');
      // Refresh history immediately so admin sees the new broadcast row.
      void fetchHistory();
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to send notification'
        : 'Failed to send notification';
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-10 h-10 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setTab('send')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            tab === 'send'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Send className="w-4 h-4" />
          Send Notification
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            tab === 'history'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Send Notification Tab */}
      {tab === 'send' && (
        <div className="max-w-3xl">
          {/* Send Form */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Send Push Notification</h2>

              {/* Success Alert */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-800">{success}</p>
                  </div>
                  <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
                    ×
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800">{error}</p>
                  </div>
                  <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
                    ×
                  </button>
                </div>
              )}

              {/* Target Audience */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Mode
                </label>
                <select
                  value={targetMode}
                  onChange={(e) => setTargetMode(e.target.value as 'broadcast' | 'single')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="broadcast">Broadcast</option>
                  <option value="single">Single User</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {targetMode === 'single' ? 'Target User ID' : 'Target Audience'}
                </label>
                {targetMode === 'single' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={usersLoading ? 'Loading users...' : 'Search by name, email, phone, or enter user ID'}
                      list="notification-user-options"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <datalist id="notification-user-options">
                      {users.map((u) => (
                        <option key={u.id} value={u.label} />
                      ))}
                    </datalist>
                    <div className="text-xs text-gray-500">
                      Selected user ID: <span className="font-medium">{targetUserId || 'None'}</span>
                    </div>
                  </div>
                ) : (
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as 'rider' | 'driver' | 'all')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="rider">All Riders</option>
                    <option value="driver">All Drivers</option>
                    <option value="all">All Riders + Drivers</option>
                  </select>
                )}
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 🎉 Special Promotion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="e.g., Get 20% off your next 5 rides! Use code SAVE20"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSendNotification}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notification History</h2>
            {historyError && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                {historyError}. Ensure <code className="bg-amber-100 px-1 rounded">VITE_API_BASE</code> points to your
                Hamba API (same as the rest of the admin), you are logged in as an admin user, or set{' '}
                <code className="bg-amber-100 px-1 rounded">VITE_ADMIN_NOTIFICATIONS_API_KEY</code> to match{' '}
                <code className="bg-amber-100 px-1 rounded">ADMIN_NOTIFICATIONS_API_KEY</code> on the server.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Target</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Message</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Sent To</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No notifications sent yet
                      </td>
                    </tr>
                  ) : (
                    history.map((notification) => (
                      <tr key={notification.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{formatDate(notification.created_at)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                              notification.user_type === 'rider'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {notification.user_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{notification.title}</td>
                        <td className="py-3 px-4 text-sm max-w-xs truncate">{notification.body}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            {notification.sent_count} users
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
