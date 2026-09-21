import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    smartphones: 'text-sky-400 bg-sky-400/[0.08] border-sky-400/20',
    laptops: 'text-indigo-400 bg-indigo-400/[0.08] border-indigo-400/20',
    ai: 'text-violet-400 bg-violet-400/[0.08] border-violet-400/20',
    gaming: 'text-emerald-400 bg-emerald-400/[0.08] border-emerald-400/20',
    wearables: 'text-rose-400 bg-rose-400/[0.08] border-rose-400/20',
    apps: 'text-cyan-400 bg-cyan-400/[0.08] border-cyan-400/20',
    startups: 'text-blue-400 bg-blue-400/[0.08] border-blue-400/20',
    gadgets: 'text-teal-400 bg-teal-400/[0.08] border-teal-400/20',
    rumors: 'text-amber-400 bg-amber-400/[0.08] border-amber-400/25',
    general: 'text-neutral-400 bg-neutral-400/[0.08] border-neutral-400/20',
  };
  return colors[category.toLowerCase()] || colors.general;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    smartphones: 'Smartphone',
    laptops: 'Laptop',
    ai: 'Brain',
    gaming: 'Gamepad2',
    wearables: 'Watch',
    apps: 'AppWindow',
    startups: 'Rocket',
    gadgets: 'Cpu',
    rumors: 'Flame',
    general: 'Globe',
  };
  return icons[category.toLowerCase()] || icons.general;
}