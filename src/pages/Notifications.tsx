import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Send as SendIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://hamba-rides-backend.onrender.com/api';

interface NotificationHistory {
  id: string;
  user_type: string;
  title: string;
  body: string;
  sent_count: number;
  created_at: string;
}

export default function Notifications() {
  const [tab, setTab] = useState(0);
  const [userType, setUserType] = useState<'rider' | 'driver'>('rider');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<NotificationHistory[]>([]);

  useEffect(() => {
    if (tab === 1) {
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
      
      // Refresh history
      if (tab === 1) {
        fetchHistory();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send notification');
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
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <NotificationsIcon sx={{ fontSize: 40, color: '#007A4D' }} />
        <Typography variant="h4" fontWeight="bold">
          Push Notifications
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<SendIcon />} label="Send Notification" />
        <Tab icon={<HistoryIcon />} label="History" />
      </Tabs>

      {/* Send Notification Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Send Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Send Push Notification
                </Typography>

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Target Audience</InputLabel>
                  <Select
                    value={userType}
                    label="Target Audience"
                    onChange={(e) => setUserType(e.target.value as 'rider' | 'driver')}
                  >
                    <MenuItem value="rider">All Riders</MenuItem>
                    <MenuItem value="driver">All Drivers</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Notification Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="e.g., 🎉 Special Promotion"
                />

                <TextField
                  fullWidth
                  label="Notification Message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  multiline
                  rows={4}
                  sx={{ mb: 2 }}
                  placeholder="e.g., Get 20% off your next 5 rides! Use code SAVE20"
                />

                <Button
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={handleSendNotification}
                  disabled={loading}
                  sx={{
                    bgcolor: '#007A4D',
                    '&:hover': { bgcolor: '#005A3D' },
                  }}
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Notification Templates */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Templates
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Rider Templates:
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setUserType('rider');
                      setTitle('🎉 Special Promotion');
                      setBody('Get 20% off your next 5 rides! Use code SAVE20');
                    }}
                  >
                    Promotion
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setUserType('rider');
                      setTitle('⚠️ Service Update');
                      setBody('We will be performing maintenance on Sunday from 2am-4am. Service may be temporarily unavailable.');
                    }}
                  >
                    Maintenance
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setUserType('rider');
                      setTitle('🎊 New Feature');
                      setBody('You can now schedule rides up to 7 days in advance! Check it out in the app.');
                    }}
                  >
                    New Feature
                  </Button>
                </Box>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Driver Templates:
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setUserType('driver');
                      setTitle('💰 Earnings Boost');
                      setBody('Drive during peak hours this weekend and earn 1.5x! Friday 5pm-10pm, Saturday 12pm-8pm.');
                    }}
                  >
                    Earnings Boost
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setUserType('driver');
                      setTitle('📋 Document Reminder');
                      setBody('Your vehicle license expires in 30 days. Please update your documents to continue driving.');
                    }}
                  >
                    Document Reminder
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setUserType('driver');
                      setTitle('⭐ Rating Milestone');
                      setBody('Congratulations! You have maintained a 4.8+ rating for 3 months. Keep up the great work!');
                    }}
                  >
                    Rating Milestone
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* History Tab */}
      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification History
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell align="right">Sent To</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">No notifications sent yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>{formatDate(notification.created_at)}</TableCell>
                        <TableCell>
                          <Chip
                            label={notification.user_type}
                            size="small"
                            color={notification.user_type === 'rider' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>{notification.title}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {notification.body}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={`${notification.sent_count} users`} size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
