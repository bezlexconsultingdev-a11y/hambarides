import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { enableAdminWebPush, getAdminWebPushStatus } from '../api/adminPush';
import styles from './Layout.module.css';

type NavItem = { to: string; label: string; match?: (path: string) => boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', match: (p) => p === '/' }],
  },
  {
    label: 'People',
    items: [
      { to: '/users', label: 'Users' },
      { to: '/drivers', label: 'Drivers', match: (p) => p === '/drivers' || p.startsWith('/applications') || p === '/driver-management' },
      { to: '/driver-management', label: 'Driver files' },
      { to: '/applications', label: 'Applications' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/rides', label: 'Rides' },
      { to: '/sos', label: 'SOS' },
      { to: '/support', label: 'Support' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/payouts-management', label: 'Payouts', match: (p) => p.startsWith('/payouts') },
      { to: '/performance', label: 'Performance' },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/notifications', label: 'Notifications' }],
  },
];

function isActive(path: string, item: NavItem) {
  if (item.match) return item.match(path);
  return path === item.to;
}

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
    return `Good ${part}, ${date}`;
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

  return (
    <div className={styles.layout}>
      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropVisible : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brandBlock}>
            <p className={styles.brandName}>Hamba Rides</p>
            <p className={styles.brandSub}>Admin</p>
          </div>
          <button type="button" className={styles.closeMenuBtn} onClick={() => setMenuOpen(false)} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className={styles.nav}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              <p className={styles.navGroupLabel}>{group.label}</p>
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={isActive(location.pathname, item) ? styles.navLinkActive : styles.navLink}
                >
                  {item.label}
                </Link>
              ))}
            </div>
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
          <button type="button" className={styles.menuBtn} onClick={() => setMenuOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <div>
            <p className={styles.greeting}>{greeting}</p>
            <p className={styles.subGreeting}>Hamba Rides admin dashboard</p>
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
            {pushStatus === 'enabled' ? 'Alerts on' : pushBusy ? 'Enabling...' : 'Enable alerts'}
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
