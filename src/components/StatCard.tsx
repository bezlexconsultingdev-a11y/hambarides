import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
  gradient?: string;
  sparklineData?: number[];
}

export default function StatCard({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  icon,
  subtitle,
  onClick,
  gradient = 'from-green-500 to-green-600',
  sparklineData,
}: StatCardProps) {
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl bg-white p-6 shadow-sm transition-all duration-200',
        'hover:shadow-md hover:-translate-y-1',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Gradient Background */}
      <div className={cn('absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full -mr-16 -mt-16', gradient)} />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          {icon && (
            <div className={cn('p-3 rounded-lg bg-gradient-to-br', gradient)}>
              <div className="text-white">{icon}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {trend && (
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{trend}</span>
            </div>
          )}
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-8">
            <svg className="w-full h-full" viewBox={`0 0 ${sparklineData.length * 10} 40`} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-green-500"
                points={sparklineData
                  .map((value, index) => {
                    const x = index * 10;
                    const max = Math.max(...sparklineData);
                    const min = Math.min(...sparklineData);
                    const y = 40 - ((value - min) / (max - min)) * 30;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
