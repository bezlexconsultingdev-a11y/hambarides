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
import RideDrawerDemoPage from './pages/RideDrawerDemoPage';
import MapDemoPage from './pages/MapDemoPage';
import SosEventsPage from './pages/SosEventsPage';
import ReceiptsPage from './pages/ReceiptsPage';
import TripLogsPage from './pages/TripLogsPage';

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
        <Route path="payouts" element={<PayoutsPage />} />
        <Route path="rides" element={<RidesPage />} />
        <Route path="sos" element={<SosEventsPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="trip-logs" element={<TripLogsPage />} />
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
