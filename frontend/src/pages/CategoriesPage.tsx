import { useGetArticlesQuery, useGetCategoriesQuery } from '../store/api/newsApi';
import { ArticleCard } from '../components/article/ArticleCard';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Laptop, Brain, Gamepad2, Watch, AppWindow, Rocket, Cpu, Globe, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function CategoriesPage() {
  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: recentArticles } = useGetArticlesQuery({ pageSize: 12 });
  const navigate = useNavigate();

  const iconMap: Record<string, LucideIcon> = {
    smartphones: Smartphone,
    laptops: Laptop,
    ai: Brain,
    gaming: Gamepad2,
    wearables: Watch,
    apps: AppWindow,
    startups: Rocket,
    gadgets: Cpu,
    rumors: Flame,
    general: Globe,
  };

  return (
    <div className="min-h-screen">
      <section className="border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="text-gradient">Browse</span> Categories
          </h1>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl">
            Explore tech news by category. Each one aggregates stories from the
            top sources in that space.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {categoriesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card p-6 skeleton h-32" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            {categories.map((cat) => {
              const Icon = iconMap[cat.value] || Globe;
              return (
                <button
                  key={cat.value}
                  onClick={() => navigate(`/?category=${cat.value}`)}
                  className="glass-card-hover text-left group"
                >
                  <Icon className="w-8 h-8 text-accent-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-1">{cat.label}</h3>
                  <p className="text-xs text-text-tertiary">
                    {cat.count} {cat.count === 1 ? 'article' : 'articles'}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="glass-card text-center py-12 mb-12">
            <p className="text-text-secondary">No categories available yet.</p>
          </div>
        )}

        {/* Recent Articles */}
        {recentArticles && recentArticles.articles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentArticles.articles.slice(0, 6).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}