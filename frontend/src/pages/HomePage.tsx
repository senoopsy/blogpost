import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Radio } from 'lucide-react';
import {
  useGetArticlesQuery,
  useGetCategoriesQuery,
} from '../store/api/newsApi';
import { ArticleCard } from '../components/article/ArticleCard';
import { CategoryFilter } from '../components/ui/CategoryFilter';
import {
  ArticleCardSkeleton,
  ArticleGridSkeleton,
  SidebarSkeleton,
} from '../components/ui/Skeletons';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || 'all';
  const searchFromUrl = searchParams.get('search') || '';

  const [activeCategory, setActiveCategory] = useState(categoryFromUrl);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setActiveCategory(categoryFromUrl);
    setPage(1);
  }, [categoryFromUrl]);

  const { data: articlesData, isLoading: articlesLoading } = useGetArticlesQuery({
    page,
    pageSize: 13,
    category: activeCategory === 'all' ? undefined : activeCategory,
    search: searchFromUrl || undefined,
  });

  const { data: categories, isLoading: categoriesLoading } =
    useGetCategoriesQuery();

  const handleCategoryChange = (category: string) => {
    if (category === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const featuredArticle = articlesData?.articles[0];
  const wireArticles = articlesData?.articles.slice(1, 4) || [];
  const gridArticles = articlesData?.articles.slice(4) || [];

  return (
    <div className="min-h-screen pb-16">
      {/* Editorial Frontpage Banner */}
      <section className="border-b border-theme py-6 sm:py-9 bg-surface/50 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            <div className="max-w-3xl space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-muted uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>The Senoopsy Tech Intelligence Report</span>
              </div>

              <h1 className="font-editorial text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight text-primary leading-tight">
                Authoritative Hardware Analysis & Silicon Intelligence
              </h1>

              <p className="text-secondary text-xs sm:text-sm lg:text-base leading-relaxed font-sans max-w-2xl">
                Exhaustive architectural teardowns, verified supply-chain intelligence from Ming-Chi Kuo, and in-depth tech journalism synthesized without external redirects.
              </p>
            </div>

            {/* Quick Topic Radar Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { label: '🔥 Leaks & Intel', query: 'category=rumors' },
                { label: 'Ming-Chi Kuo', query: 'search=Ming-Chi' },
                { label: 'Apple Silicon', query: 'search=Apple' },
                { label: 'AI Models', query: 'category=ai' },
                { label: 'Smartphones', query: 'category=smartphones' },
                { label: 'Laptops', query: 'category=laptops' },
              ].map((chip) => (
                <Link
                  key={chip.label}
                  to={`/?${chip.query}`}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-mono text-secondary hover:text-primary bg-surface-subtle hover:bg-surface-hover border border-theme transition-colors whitespace-nowrap"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Frontpage Grid Layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12">
        {/* Asymmetric Frontpage Feature: Lead Story (Left) + The Wire (Right) */}
        {activeCategory === 'all' && !searchFromUrl && (
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-2 text-xs font-mono text-muted uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-primary font-bold">Frontpage Lead Investigation</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-500" />
                <span>Live Intelligence Wire</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Main Feature Lead */}
              <div className="lg:col-span-8">
                {articlesLoading ? (
                  <ArticleCardSkeleton variant="featured" />
                ) : featuredArticle ? (
                  <ArticleCard article={featuredArticle} variant="featured" />
                ) : null}
              </div>

              {/* The Intelligence Wire Stream */}
              <div className="lg:col-span-4 space-y-3">
                <div className="p-2.5 sm:p-3 bg-surface-subtle border border-theme rounded-xl flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Breaking Bulletins
                  </span>
                  <span className="font-mono text-[10px] text-emerald-500 font-bold">UPDATED LIVE</span>
                </div>

                {articlesLoading ? (
                  <div className="space-y-3">
                    <ArticleCardSkeleton variant="compact" />
                    <ArticleCardSkeleton variant="compact" />
                    <ArticleCardSkeleton variant="compact" />
                  </div>
                ) : (
                  wireArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="wire"
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Category Feed & Story Archive Section */}
        <section className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-theme">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 lg:self-start">
              {categoriesLoading ? (
                <SidebarSkeleton />
              ) : categories ? (
                <CategoryFilter
                  categories={categories}
                  activeCategory={activeCategory}
                  onCategoryChange={handleCategoryChange}
                />
              ) : null}
            </aside>

            {/* Main Editorial Feed Grid */}
            <main className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-theme">
                <div className="flex items-center gap-2">
                  <h2 className="font-editorial text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                    {activeCategory === 'all'
                      ? 'Latest Field Reports'
                      : categories?.find((c) => c.value === activeCategory)?.label || activeCategory}
                  </h2>
                  {articlesData?.total !== undefined && (
                    <span className="text-[11px] sm:text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle text-muted border border-theme">
                      {articlesData.total} {articlesData.total === 1 ? 'story' : 'stories'}
                    </span>
                  )}
                </div>

                {activeCategory !== 'all' && (
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="text-xs font-mono text-secondary hover:text-primary transition-colors underline"
                  >
                    All Sections
                  </button>
                )}
              </div>

              {articlesLoading ? (
                <ArticleGridSkeleton count={6} />
              ) : (activeCategory === 'all' && !searchFromUrl ? gridArticles : articlesData?.articles || []).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {(activeCategory === 'all' && !searchFromUrl ? gridArticles : articlesData?.articles || []).map((article) => (
                    <ArticleCard key={article.id} article={article} variant="default" />
                  ))}
                </div>
              ) : (
                <div className="surface-card p-8 sm:p-12 text-center max-w-md mx-auto">
                  <h3 className="font-editorial text-lg sm:text-xl font-bold text-primary mb-2">No Reports Found</h3>
                  <p className="text-xs text-secondary mb-4">
                    No articles currently match your selection.
                  </p>
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="btn-primary text-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              )}

              {/* Pagination */}
              {articlesData && articlesData.total > 12 && (
                <div className="flex items-center justify-between pt-6 border-t border-theme">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  <span className="text-xs font-mono text-muted">
                    Page {page} of {Math.ceil(articlesData.total / 12)}
                  </span>

                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!articlesData.has_more}
                    className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </main>
          </div>
        </section>
      </div>
    </div>
  );
}