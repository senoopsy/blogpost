export function ArticleCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'featured' | 'compact' }) {
  if (variant === 'featured') {
    return (
      <div className="glass-card p-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="aspect-video lg:aspect-auto rounded-xl skeleton" />
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full skeleton" />
              <div className="h-6 w-16 rounded-full skeleton" />
            </div>
            <div className="h-8 w-full rounded skeleton" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded skeleton" />
              <div className="h-4 w-3/4 rounded skeleton" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 w-24 rounded skeleton" />
              <div className="h-4 w-16 rounded skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="h-3 w-16 rounded skeleton" />
              <div className="h-3 w-12 rounded skeleton" />
            </div>
            <div className="h-5 w-full rounded skeleton" />
            <div className="h-4 w-full rounded skeleton" />
          </div>
          <div className="w-24 h-24 rounded-lg skeleton" />
        </div>
      </div>
    );
  }

  // Default
  return (
    <div className="glass-card animate-pulse">
      <div className="aspect-video rounded-xl skeleton mb-4" />
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full skeleton" />
        </div>
        <div className="h-5 w-full rounded skeleton" />
        <div className="h-5 w-3/4 rounded skeleton" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-5/6 rounded skeleton" />
        </div>
        <div className="h-4 w-20 rounded skeleton" />
      </div>
    </div>
  );
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-6 w-24 rounded skeleton mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-20 rounded skeleton" />
            <div className="h-5 w-8 rounded-full skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="text-2xl font-bold text-text-muted w-8">
            {i + 1}
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full rounded skeleton" />
            <div className="h-3 w-24 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}