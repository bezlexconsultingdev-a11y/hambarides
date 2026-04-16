import { 
  LayoutDashboard, 
  Users, 
  Car, 
  DollarSign, 
  ClipboardList, 
  ChevronDown,
  ChevronRight,
  UserCircle,
  UserCheck,
  MapPin,
  Activity,
  AlertTriangle,
  CreditCard,
  BarChart3,
  Receipt,
  FileText,
  MessageSquare,
  Scale,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/',
  },
  {
    id: 'users',
    label: 'Users',
    icon: <Users className="w-5 h-5" />,
    children: [
      { id: 'all-users', label: 'All Users', icon: <UserCircle className="w-4 h-4" />, path: '/users' },
      { id: 'riders', label: 'Riders', icon: <Users className="w-4 h-4" />, path: '/riders' },
      { id: 'drivers', label: 'Drivers', icon: <UserCheck className="w-4 h-4" />, path: '/drivers' },
    ],
  },
  {
    id: 'rides',
    label: 'Rides',
    icon: <Car className="w-5 h-5" />,
    children: [
      { id: 'all-rides', label: 'All Rides', icon: <Car className="w-4 h-4" />, path: '/rides' },
      { id: 'active-rides', label: 'Active Rides', icon: <Activity className="w-4 h-4" />, path: '/rides/active' },
      { id: 'trip-logs', label: 'Trip Logs', icon: <MapPin className="w-4 h-4" />, path: '/trip-logs' },
      { id: 'sos-alerts', label: 'SOS Alerts', icon: <AlertTriangle className="w-4 h-4" />, path: '/sos-alerts' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <DollarSign className="w-5 h-5" />,
    children: [
      { id: 'payouts', label: 'Payouts', icon: <CreditCard className="w-4 h-4" />, path: '/payouts' },
      { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, path: '/financial-analytics' },
      { id: 'receipts', label: 'Receipts', icon: <Receipt className="w-4 h-4" />, path: '/receipts' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: <ClipboardList className="w-5 h-5" />,
    children: [
      { id: 'applications', label: 'Applications', icon: <FileText className="w-4 h-4" />, path: '/driver-applications' },
      { id: 'support', label: 'Support', icon: <MessageSquare className="w-4 h-4" />, path: '/support-tickets' },
      { id: 'disputes', label: 'Disputes', icon: <Scale className="w-4 h-4" />, path: '/disputes' },
      { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" />, path: '/driver-performance' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['users', 'rides', 'finance', 'operations', 'settings']);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.path);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.path) {
              handleNavigation(item.path);
            }
          }}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors',
            level === 0 ? 'text-sm font-medium' : 'text-sm',
            active
              ? 'bg-green-50 text-green-700'
              : 'text-gray-700 hover:bg-gray-100',
            level > 0 && 'ml-4'
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-transform duration-300',
          'w-72 overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:sticky lg:top-16'
        )}
      >
        <div className="p-4 space-y-2">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </aside>
    </>
  );
}
