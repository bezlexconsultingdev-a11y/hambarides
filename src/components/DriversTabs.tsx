import { Link, useLocation } from 'react-router-dom';
import styles from './DriversTabs.module.css';

const TABS = [
  { to: '/drivers', label: 'All drivers', match: (path: string) => path === '/drivers' },
  { to: '/applications', label: 'Applications', match: (path: string) => path.startsWith('/applications') },
  {
    to: '/category-upgrades',
    label: 'Category upgrades',
    match: (path: string) => path.startsWith('/category-upgrades'),
  },
  {
    to: '/vehicle-approvals',
    label: 'Vehicle approvals',
    match: (path: string) => path.startsWith('/vehicle-approvals'),
  },
  { to: '/driver-management', label: 'Driver files', match: (path: string) => path === '/driver-management' },
];

export default function DriversTabs() {
  const location = useLocation();

  return (
    <div className={styles.tabs}>
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={tab.match(location.pathname) ? styles.tabActive : styles.tab}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
