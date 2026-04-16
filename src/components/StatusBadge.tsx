import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'info' | 'warning' | 'error' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StatusBadge({ 
  status, 
  variant = 'default', 
  size = 'md',
  className 
}: StatusBadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        getVariantStyles(),
        getSizeStyles(),
        className
      )}
    >
      {status}
    </span>
  );
}
