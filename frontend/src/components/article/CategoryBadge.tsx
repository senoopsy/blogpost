import { cn, getCategoryColor } from '../../lib/utils';

interface CategoryBadgeProps {
  category: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CategoryBadge({
  category,
  label,
  size = 'md',
  className,
}: CategoryBadgeProps) {
  const colorClass = getCategoryColor(category);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'rounded-full font-medium border backdrop-blur-sm',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {label || category}
    </span>
  );
}