import { Smartphone, Laptop, Brain, Gamepad2, Watch, AppWindow, Rocket, Cpu, Globe, LayoutGrid, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Category } from '../../types';

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  all: LayoutGrid,
  rumors: Flame,
  smartphones: Smartphone,
  laptops: Laptop,
  ai: Brain,
  gaming: Gamepad2,
  wearables: Watch,
  apps: AppWindow,
  startups: Rocket,
  gadgets: Cpu,
  general: Globe,
};

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const allCategories = [
    { value: 'all', label: 'All Stories', count: categories.reduce((acc, c) => acc + c.count, 0) },
    ...categories,
  ];

  return (
    <>
      {/* Mobile & Tablet Horizontal Scrolling Category Ribbon (< lg) */}
      <div className="lg:hidden w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 min-w-max pb-1">
          {allCategories.map((category) => {
            const Icon = categoryIcons[category.value] || Globe;
            const isActive = activeCategory === category.value;

            return (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border',
                  isActive
                    ? 'bg-primary text-canvas border-primary font-bold shadow-sm'
                    : 'bg-surface border-theme text-secondary hover:text-primary hover:bg-surface-hover'
                )}
              >
                <Icon
                  className={cn(
                    'w-3 h-3',
                    isActive ? 'text-canvas' : category.value === 'rumors' ? 'text-amber-500' : 'text-muted'
                  )}
                />
                <span>{category.label}</span>
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.2 rounded',
                    isActive ? 'bg-canvas/20 text-canvas' : 'text-muted'
                  )}
                >
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sticky Vertical Sidebar (lg+) */}
      <div className="hidden lg:block surface-card p-4">
        <h3 className="text-xs font-mono font-semibold text-muted mb-3 uppercase tracking-wider px-2">
          Sections
        </h3>
        <div className="space-y-1">
          {allCategories.map((category) => {
            const Icon = categoryIcons[category.value] || Globe;
            const isActive = activeCategory === category.value;

            return (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary text-canvas font-bold shadow-sm'
                    : 'text-secondary hover:text-primary hover:bg-surface-hover'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5',
                      isActive ? 'text-canvas' : category.value === 'rumors' ? 'text-amber-500' : 'text-muted'
                    )}
                  />
                  <span>{category.label}</span>
                </div>
                <span
                  className={cn(
                    'text-[11px] font-mono px-2 py-0.5 rounded',
                    isActive
                      ? 'bg-canvas/20 text-canvas font-bold'
                      : 'text-muted'
                  )}
                >
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}