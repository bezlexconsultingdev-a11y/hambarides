import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { enableAdminWebPush, getAdminWebPushStatus } from '../api/adminPush';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState('default');
  const [pushBusy, setPushBusy] = useState(false);

  const greeting = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const date = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
    return `Good ${part} admin, ${date}`;
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    getAdminWebPushStatus()
      .then(setPushStatus)
      .catch(() => setPushStatus('unsupported'));
  }, []);

  const enablePush = async () => {
    try {
      setPushBusy(true);
      await enableAdminWebPush();
      setPushStatus('enabled');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not enable notifications.';
      alert(message);
      getAdminWebPushStatus()
        .then(setPushStatus)
        .catch(() => setPushStatus('unsupported'));
    } finally {
      setPushBusy(false);
    }
  };

  const navItems = [
    { to: '/', label: 'Dashboard' },
    { to: '/users', label: 'Users' },
    { to: '/drivers', label: 'Drivers' },
    { to: '/driver-management', label: 'Driver Management' },
    { to: '/applications', label: 'Applications' },
    { to: '/payouts', label: 'Payouts' },
    { to: '/payouts-management', label: 'Payout Management' },
    { to: '/performance', label: 'Driver Performance' },
    { to: '/rides', label: 'Rides' },
    { to: '/support', label: 'Support Tickets' },
    { to: '/sos', label: 'SOS events' },
    { to: '/notifications', label: 'Notifications' },
  ];

  return (
    <div className={styles.layout}>
      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropVisible : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <img src="/logo.png" alt="Hamba Rides" className={styles.logoImage} />
          <h1 className={styles.logo}>Admin</h1>
          <button type="button" className={styles.closeMenuBtn} onClick={() => setMenuOpen(false)}>
            X
          </button>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={location.pathname === item.to ? styles.navLinkActive : styles.navLink}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={styles.userEmail}>{user?.email}</span>
          <button type="button" onClick={logout} className={styles.logoutBtn}>
            Log out
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={styles.menuBtn} onClick={() => setMenuOpen(true)}>
            ☰
          </button>
          <div>
            <p className={styles.greeting}>{greeting}</p>
            <p className={styles.subGreeting}>Private Hamba Rides admin dashboard</p>
          </div>
          <button
            type="button"
            className={pushStatus === 'enabled' ? styles.pushBtnEnabled : styles.pushBtn}
            onClick={enablePush}
            disabled={pushBusy || pushStatus === 'unsupported' || pushStatus === 'blocked'}
            title={
              pushStatus === 'blocked'
                ? 'Notifications are blocked in this browser'
                : pushStatus === 'unsupported'
                  ? 'This browser does not support web push'
                  : 'Enable admin notifications'
            }
          >
            {pushStatus === 'enabled' ? 'Notifications on' : pushBusy ? 'Enabling...' : 'Enable alerts'}
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
