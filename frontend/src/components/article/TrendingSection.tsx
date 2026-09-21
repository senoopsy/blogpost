import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { formatTimeAgo, truncate } from '../../lib/utils';
import type { Article } from '../../types';

interface TrendingSectionProps {
  articles: Article[];
  title?: string;
}

export function TrendingSection({
  articles,
  title = 'Trending Radar',
}: TrendingSectionProps) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.06]">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">{title}</h3>
      </div>

      <div className="space-y-2">
        {articles.slice(0, 6).map((article, index) => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className="group flex gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.06]"
          >
            <span className="text-xl font-mono font-bold text-[#636674] w-5 flex-shrink-0 group-hover:text-white transition-colors">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] text-[#737686] font-mono uppercase mb-1">
                <span className="text-[#a1a4b2] font-semibold">{article.source}</span>
                <span>•</span>
                <span>{formatTimeAgo(article.published_at)}</span>
                {article.is_rumor && (
                  <span className="text-amber-400 font-bold">
                    LEAK
                  </span>
                )}
              </div>
              
              <h4 className="font-medium text-[#f2f2f5] text-xs sm:text-sm group-hover:text-white transition-colors line-clamp-2 leading-snug">
                {truncate(article.title, 80)}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}