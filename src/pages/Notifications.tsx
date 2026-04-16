import { useState, useEffect } from 'react';
import { Bell, Send, History, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://hamba-rides-backend.onrender.com/api';

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
  const [userType, setUserType] = useState<'rider' | 'driver'>('rider');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<NotificationHistory[]>([]);

  useEffect(() => {
    if (tab === 'history') {
      fetchHistory();
    }
  }, [tab]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/history`);
      setHistory(response.data.history);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleSendNotification = async () => {
    if (!title || !body) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_URL}/notifications/broadcast`, {
        userType,
        title,
        body,
      });

      setSuccess(`Notification sent to ${response.data.sentCount} ${userType}s successfully!`);
      setTitle('');
      setBody('');
      
      if (tab === 'history') {
        fetchHistory();
      }
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || 'Failed to send notification'
        : 'Failed to send notification';
      setError(errorMessage);
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

  const setTemplate = (type: string) => {
    if (type === 'rider-promotion') {
      setUserType('rider');
      setTitle('🎉 Special Promotion');
      setBody('Get 20% off your next 5 rides! Use code SAVE20');
    } else if (type === 'rider-maintenance') {
      setUserType('rider');
      setTitle('⚠️ Service Update');
      setBody('We will be performing maintenance on Sunday from 2am-4am. Service may be temporarily unavailable.');
    } else if (type === 'rider-feature') {
      setUserType('rider');
      setTitle('🎊 New Feature');
      setBody('You can now schedule rides up to 7 days in advance! Check it out in the app.');
    } else if (type === 'driver-boost') {
      setUserType('driver');
      setTitle('💰 Earnings Boost');
      setBody('Drive during peak hours this weekend and earn 1.5x! Friday 5pm-10pm, Saturday 12pm-8pm.');
    } else if (type === 'driver-document') {
      setUserType('driver');
      setTitle('📋 Document Reminder');
      setBody('Your vehicle license expires in 30 days. Please update your documents to continue driving.');
    } else if (type === 'driver-rating') {
      setUserType('driver');
      setTitle('⭐ Rating Milestone');
      setBody('Congratulations! You have maintained a 4.8+ rating for 3 months. Keep up the great work!');
    }
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Form */}
          <div className="lg:col-span-2">
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
                  Target Audience
                </label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as 'rider' | 'driver')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="rider">All Riders</option>
                  <option value="driver">All Drivers</option>
                </select>
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

          {/* Quick Templates */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Templates</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Rider Templates</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setTemplate('rider-promotion')}
                      className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      🎉 Promotion
                    </button>
                    <button
                      onClick={() => setTemplate('rider-maintenance')}
                      className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      ⚠️ Maintenance
                    </button>
                    <button
                      onClick={() => setTemplate('rider-feature')}
                      className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      🎊 New Feature
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Driver Templates</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setTemplate('driver-boost')}
                      className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      💰 Earnings Boost
                    </button>
                    <button
                      onClick={() => setTemplate('driver-document')}
                      className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      📋 Document Reminder
                    </button>
                    <button
                      onClick={() => setTemplate('driver-rating')}
                      className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      ⭐ Rating Milestone
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notification History</h2>

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
