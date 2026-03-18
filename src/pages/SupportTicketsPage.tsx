import { useState, useEffect } from 'react';
import { api } from '../api/client';
import styles from './SupportTicketsPage.module.css';

interface Ticket {
  id: string;
  user_id: string;
  user_type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  first_name: string;
  last_name: string;
  created_at: string;
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      
      const response = await api.get(`/admin/support/tickets?${params.toString()}`);
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: string) => {
    try {
      const response = await api.get(`/admin/support/tickets/${ticketId}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to load ticket details:', error);
    }
  };

  const handleTicketClick = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await loadTicketDetails(ticket.id);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSending(true);
      await api.post(`/admin/support/tickets/${selectedTicket.id}/reply`, {
        message: replyText
      });
      setReplyText('');
      await loadTicketDetails(selectedTicket.id);
      await loadTickets();
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;

    try {
      await api.patch(`/admin/support/tickets/${selectedTicket.id}/status`, { status });
      setSelectedTicket({ ...selectedTicket, status });
      await loadTickets();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#007bff';
      case 'in_progress': return '#ffc107';
      case 'resolved': return '#28a745';
      case 'closed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading tickets...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Support Tickets</h1>
        <div className={styles.filters}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.ticketsList}>
          {tickets.length === 0 ? (
            <div className={styles.emptyState}>No tickets found</div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`${styles.ticketCard} ${selectedTicket?.id === ticket.id ? styles.ticketCardActive : ''}`}
                onClick={() => handleTicketClick(ticket)}
              >
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketUser}>
                    {ticket.first_name} {ticket.last_name}
                    <span className={styles.userType}>{ticket.user_type}</span>
                  </div>
                  <div className={styles.ticketMeta}>
                    <span
                      className={styles.priorityBadge}
                      style={{ background: getPriorityColor(ticket.priority) }}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className={styles.statusBadge}
                      style={{ background: getStatusColor(ticket.status) }}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className={styles.ticketSubject}>{ticket.subject}</div>
                <div className={styles.ticketDescription}>
                  {ticket.description.substring(0, 100)}
                  {ticket.description.length > 100 && '...'}
                </div>
                <div className={styles.ticketFooter}>
                  <span>{formatDate(ticket.created_at)}</span>
                  {ticket.category && <span className={styles.category}>{ticket.category}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.ticketDetails}>
          {selectedTicket ? (
            <>
              <div className={styles.detailsHeader}>
                <div>
                  <h2>{selectedTicket.subject}</h2>
                  <div className={styles.detailsMeta}>
                    <span>{selectedTicket.first_name} {selectedTicket.last_name}</span>
                    <span>•</span>
                    <span>{selectedTicket.email}</span>
                    <span>•</span>
                    <span className={styles.userType}>{selectedTicket.user_type}</span>
                  </div>
                </div>
                <div className={styles.statusActions}>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className={styles.statusSelect}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className={styles.messagesContainer}>
                <div className={styles.initialMessage}>
                  <div className={styles.messageHeader}>
                    <strong>{selectedTicket.first_name} {selectedTicket.last_name}</strong>
                    <span className={styles.messageTime}>{formatDate(selectedTicket.created_at)}</span>
                  </div>
                  <div className={styles.messageContent}>{selectedTicket.description}</div>
                </div>

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.is_admin ? styles.adminMessage : styles.userMessage}
                  >
                    <div className={styles.messageHeader}>
                      <strong>
                        {message.is_admin ? 'Admin' : `${message.first_name} ${message.last_name}`}
                      </strong>
                      <span className={styles.messageTime}>{formatDate(message.created_at)}</span>
                    </div>
                    <div className={styles.messageContent}>{message.message}</div>
                  </div>
                ))}
              </div>

              <div className={styles.replyBox}>
                <textarea
                  className={styles.replyTextarea}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                />
                <button
                  className={styles.sendButton}
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
