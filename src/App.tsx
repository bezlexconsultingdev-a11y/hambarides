import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import DriversPage from './pages/DriversPage';
import RidesPage from './pages/RidesPage';
import ApplicationsPage from './pages/ApplicationsPage';
import PayoutsPage from './pages/PayoutsPage';
import PayoutsManagementPage from './pages/PayoutsManagementPage';
import FinancialAnalyticsPage from './pages/FinancialAnalyticsPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import SystemConfigPage from './pages/SystemConfigPage';
import DisputesPage from './pages/DisputesPage';
import DriverPerformancePage from './pages/DriverPerformancePage';
import DriverApplicationsEnhancedPage from './pages/DriverApplicationsEnhancedPage';
import SOSAlertsPage from './pages/SOSAlertsPage';
import TripSharingAnalyticsPage from './pages/TripSharingAnalyticsPage';
import RideDrawerDemoPage from './pages/RideDrawerDemoPage';
import MapDemoPage from './pages/MapDemoPage';
import SosEventsPage from './pages/SosEventsPage';
import ReceiptsPage from './pages/ReceiptsPage';
import TripLogsPage from './pages/TripLogsPage';
import PricingPage from './pages/PricingPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24, color: '#888' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications-enhanced" element={<DriverApplicationsEnhancedPage />} />
        <Route path="sos-alerts" element={<SOSAlertsPage />} />
        <Route path="trip-sharing" element={<TripSharingAnalyticsPage />} />
        <Route path="payouts" element={<PayoutsPage />} />
        <Route path="payouts-management" element={<PayoutsManagementPage />} />
        <Route path="analytics" element={<FinancialAnalyticsPage />} />
        <Route path="support" element={<SupportTicketsPage />} />
        <Route path="system-config" element={<SystemConfigPage />} />
        <Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
        <Route path="performance" element={<ProtectedRoute><DriverPerformancePage /></ProtectedRoute>} />
        <Route path="rides" element={<RidesPage />} />
        <Route path="sos" element={<SosEventsPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="trip-logs" element={<TripLogsPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="ride-drawer" element={<RideDrawerDemoPage />} />
        <Route path="map" element={<MapDemoPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
