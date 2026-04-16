import { ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface QuickActionCardProps {
  title: string;
  count: number;
  subtitle?: string;
  icon: React.ReactNode;
  onClick: () => void;
  urgent?: boolean;
  color?: 'green' | 'blue' | 'amber' | 'red' | 'navy';
}

export default function QuickActionCard({
  title,
  count,
  subtitle,
  icon,
  onClick,
  urgent = false,
  color = 'green',
}: QuickActionCardProps) {
  const getColorStyles = () => {
    switch (color) {
      case 'green':
        return 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700';
      case 'blue':
        return 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700';
      case 'amber':
        return 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700';
      case 'red':
        return 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
      case 'navy':
        return 'from-blue-900 to-blue-950 hover:from-blue-950 hover:to-black';
      default:
        return 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl p-6 shadow-sm transition-all duration-200',
        'cursor-pointer hover:shadow-md hover:-translate-y-1',
        'bg-gradient-to-br text-white',
        getColorStyles(),
        urgent && 'animate-pulse'
      )}
    >
      {/* Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
          {icon}
        </div>
        {urgent && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            URGENT
          </span>
        )}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-3xl font-bold mb-2">{count}</p>
      {subtitle && <p className="text-sm text-white/80 mb-4">{subtitle}</p>}

      {/* Action */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>View All</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}
