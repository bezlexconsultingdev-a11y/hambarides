import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logo}>Admin</h1>
        </div>
        <nav className={styles.nav}>
          <Link
            to="/"
            className={location.pathname === '/' ? styles.navLinkActive : styles.navLink}
          >
            Dashboard
          </Link>
          <Link
            to="/users"
            className={location.pathname === '/users' ? styles.navLinkActive : styles.navLink}
          >
            Users
          </Link>
          <Link
            to="/drivers"
            className={location.pathname === '/drivers' ? styles.navLinkActive : styles.navLink}
          >
            Drivers
          </Link>
          <Link
            to="/applications"
            className={location.pathname === '/applications' ? styles.navLinkActive : styles.navLink}
          >
            Applications
          </Link>
          <Link
            to="/payouts"
            className={location.pathname === '/payouts' ? styles.navLinkActive : styles.navLink}
          >
            Payouts
          </Link>
          <Link
            to="/rides"
            className={location.pathname === '/rides' ? styles.navLinkActive : styles.navLink}
          >
            Rides
          </Link>
          <Link
            to="/sos"
            className={location.pathname === '/sos' ? styles.navLinkActive : styles.navLink}
          >
            SOS events
          </Link>
          <Link
            to="/receipts"
            className={location.pathname === '/receipts' ? styles.navLinkActive : styles.navLink}
          >
            Receipts
          </Link>
          <Link
            to="/trip-logs"
            className={location.pathname === '/trip-logs' ? styles.navLinkActive : styles.navLink}
          >
            Trip logs
          </Link>
          <Link
            to="/ride-drawer"
            className={location.pathname === '/ride-drawer' ? styles.navLinkActive : styles.navLink}
          >
            Ride drawer
          </Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={styles.userEmail}>{user?.email}</span>
          <button type="button" onClick={logout} className={styles.logoutBtn}>
            Log out
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
