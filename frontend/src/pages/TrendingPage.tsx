import { useGetTrendingArticlesQuery } from '../store/api/newsApi';
import { TrendingSection } from '../components/article/TrendingSection';
import { TrendingSkeleton } from '../components/ui/Skeletons';
import { TrendingUp, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TrendingPage() {
  const { data: trendingArticles, isLoading } = useGetTrendingArticlesQuery({
    limit: 20,
  });

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Section */}
      <section className="border-b border-white/[0.08] bg-[#0c0d14] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400 uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>GLOBAL TRACTION & VIRALITY INDEX</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Trending Field Intelligence
          </h1>

          <p className="mt-2 text-[#9fa3b5] text-sm max-w-2xl font-sans">
            The most widely read tech investigations, hardware leaks, and architectural breakdowns across the Senoopsy network.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="surface-card p-6">
                <TrendingSkeleton />
              </div>
            ) : trendingArticles && trendingArticles.length > 0 ? (
              <div className="surface-card p-6 bg-[#12141d]">
                <h2 className="font-editorial text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Most Active Dispatches
                </h2>
                <TrendingSection articles={trendingArticles} />
              </div>
            ) : (
              <div className="surface-card text-center py-12">
                <p className="text-[#8e92a4] text-xs">No trending reports calculated yet.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="surface-card p-6 bg-[#12141d]">
              <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-white mb-4 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Key Topic Radars
              </h3>
              <div className="space-y-1.5 font-mono text-xs">
                {[
                  { tag: 'Ming-Chi Kuo Leaks', q: 'Ming-Chi' },
                  { tag: 'Apple Intelligence', q: 'Apple' },
                  { tag: 'OpenAI & Claude LLMs', q: 'AI' },
                  { tag: 'Snapdragon 8 Gen 4', q: 'Snapdragon' },
                  { tag: 'Wi-Fi 7 Hardware', q: 'Wi-Fi' }
                ].map((item) => (
                  <Link
                    key={item.tag}
                    to={`/search?q=${encodeURIComponent(item.q)}`}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-[#9fa3b5] hover:text-white"
                  >
                    #{item.tag.toLowerCase().replace(/[^a-z0-9]/g, '')}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}