import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { useGetArticlesQuery } from '../store/api/newsApi';
import { ArticleCard } from '../components/article/ArticleCard';
import { ArticleGridSkeleton } from '../components/ui/Skeletons';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const { data: results, isLoading } = useGetArticlesQuery({
    page: 1,
    pageSize: 50,
    search: initialQuery || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchParams.set('q', query.trim());
      setSearchParams(searchParams);
    }
  };

  const handleClear = () => {
    setQuery('');
    searchParams.delete('q');
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mb-8 space-y-2">
          <span className="text-[11px] font-mono text-[#787c8f] uppercase tracking-widest">
            SENOOPSY INTELLIGENCE SEARCH
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-white">
            Search Wire & Leak Database
          </h1>
          <p className="text-xs text-[#8e92a4]">
            Query hardware specifications, leaker reports (e.g. Ming-Chi Kuo), silicon architectures, and news archives.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787c8f]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keywords, device name, leaker, or technical specs..."
            className="w-full glass-input pl-11 pr-12 py-3 text-sm rounded-xl"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/[0.08] transition-colors text-[#787c8f] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Results */}
        {initialQuery && (
          <>
            <div className="mb-6 flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs font-mono text-[#8e92a4]">
              <span>
                {isLoading ? (
                  'Querying wire...'
                ) : (
                  <>
                    FOUND <span className="text-white font-bold">{results?.total || 0}</span> REPORTS MATCHING "{initialQuery}"
                  </>
                )}
              </span>
            </div>

            {isLoading ? (
              <ArticleGridSkeleton count={9} />
            ) : results && results.articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="surface-card text-center py-16 max-w-md mx-auto">
                <h3 className="font-editorial text-xl font-bold text-white mb-2">No Matching Intelligence</h3>
                <p className="text-xs text-[#8e92a4]">
                  No reports matched "{initialQuery}". Try searching for specific hardware models or leaker names.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}