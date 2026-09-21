import { Link, useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, Flame, ArrowUpRight, ShieldCheck, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import { cn, formatTimeAgo, getCategoryColor } from '../../lib/utils';
import type { Article } from '../../types';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact' | 'wire';
  className?: string;
}

export function ArticleCard({
  article,
  variant = 'default',
  className,
}: ArticleCardProps) {
  const navigate = useNavigate();
  const categoryColorClass = getCategoryColor(article.category);
  const articlePath = `/article/${article.id}`;

  const handleCardClick = () => {
    navigate(articlePath);
  };

  // Clean takeaway text preview (strip bold markdown prefixes)
  const rawTakeaway = article.key_takeaways?.[0] || '';
  const cleanTakeaway = rawTakeaway.replace(/\*\*.*?\*\*:?\s*/g, '').trim();
  const hasImage = Boolean(article.image_url);

  // FEATURED / LEAD STORY VARIANT
  if (variant === 'featured') {
    return (
      <article
        onClick={handleCardClick}
        className={cn(
          'surface-card-hover group cursor-pointer p-4 sm:p-6 lg:p-7 relative overflow-hidden',
          className
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center">
          {/* Left Column: Image (if image exists) OR Editorial Narrative (if no image) */}
          {hasImage ? (
            <div className="md:col-span-6 lg:col-span-7 min-w-0 w-full">
              <div className="relative aspect-[16/10] w-full max-h-[380px] overflow-hidden rounded-xl bg-surface-subtle border border-theme">
                <img
                  src={article.image_url || undefined}
                  alt={article.title}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500 ease-out block"
                  loading="lazy"
                />
                
                {/* Category & Leaker Badges */}
                <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-wrap gap-1.5 sm:gap-2 pointer-events-none">
                  <span className={cn('px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold backdrop-blur-md border shadow-sm', categoryColorClass)}>
                    {article.category_display || article.category}
                  </span>

                  {article.is_rumor && (
                    <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 backdrop-blur-md">
                      <Flame className="w-3 h-3 text-amber-500" />
                      {article.leaker_name ? `${article.leaker_name}` : 'Verified Leak'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="md:col-span-7 min-w-0 w-full flex flex-col justify-between space-y-3.5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold border shadow-sm', categoryColorClass)}>
                    {article.category_display || article.category}
                  </span>

                  {article.is_rumor && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40">
                      <Flame className="w-3 h-3 text-amber-500" />
                      {article.leaker_name ? `${article.leaker_name}` : 'Verified Leak'}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-muted font-mono tracking-wider uppercase ml-auto">
                    <span className="text-primary font-semibold">{article.source}</span>
                    <span>•</span>
                    <span>{article.reading_time_minutes ? `${article.reading_time_minutes} MIN` : formatTimeAgo(article.published_at)}</span>
                  </div>
                </div>

                <Link
                  to={articlePath}
                  className="block group-hover:text-amber-500 dark:group-hover:text-amber-200 transition-colors"
                >
                  <h2 className="font-editorial text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary leading-[1.2]">
                    {article.title}
                  </h2>
                </Link>

                {article.summary && (
                  <p className="text-secondary text-xs sm:text-sm leading-relaxed font-sans line-clamp-3">
                    {article.summary}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-theme text-xs text-muted">
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  {article.confidence_score && (
                    <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {article.confidence_score}% Accuracy
                    </span>
                  )}
                  <span>{formatTimeAgo(article.published_at)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-2.5 py-1 rounded-md bg-surface-subtle hover:bg-surface-hover border border-theme text-xs font-mono text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
                    title={`Open original report on ${article.source}`}
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <Link
                    to={articlePath}
                    className="btn-primary text-xs"
                  >
                    <span>Read Report</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Editorial Text (if image exists) OR Executive Takeaway Card (if no image) */}
          <div className={cn(
            "min-w-0 w-full flex flex-col justify-between space-y-3",
            hasImage ? "md:col-span-6 lg:col-span-5" : "md:col-span-5"
          )}>
            {hasImage ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-muted font-mono tracking-wider uppercase">
                    <span className="text-primary font-semibold">{article.source}</span>
                    <span>•</span>
                    <span>{article.reading_time_minutes ? `${article.reading_time_minutes} MIN` : formatTimeAgo(article.published_at)}</span>
                    {article.trending_score > 0 && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:flex text-amber-500 items-center gap-1 font-semibold">
                          <TrendingUp className="w-3 h-3" />
                          FEATURED
                        </span>
                      </>
                    )}
                  </div>

                  <Link
                    to={articlePath}
                    className="block group-hover:text-amber-500 dark:group-hover:text-amber-200 transition-colors"
                  >
                    <h2 className="font-editorial text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-primary leading-[1.22] line-clamp-3">
                      {article.title}
                    </h2>
                  </Link>

                  {article.summary && (
                    <p className="text-secondary text-xs leading-relaxed font-sans line-clamp-2">
                      {article.summary}
                    </p>
                  )}

                  {cleanTakeaway && (
                    <div className="p-2.5 rounded-lg bg-surface-subtle border-l-2 border-amber-500 text-xs text-secondary leading-relaxed font-sans">
                      <span className="font-semibold text-primary block mb-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-500">
                        Key Editorial Takeaway
                      </span>
                      <span className="line-clamp-2">{cleanTakeaway}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-theme text-xs text-muted">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    {article.confidence_score && (
                      <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {article.confidence_score}%
                      </span>
                    )}
                    <span>{formatTimeAgo(article.published_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded-md bg-surface-subtle hover:bg-surface-hover border border-theme text-xs font-mono text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
                      title={`Open original report on ${article.source}`}
                    >
                      <span>Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <Link
                      to={articlePath}
                      className="btn-primary text-xs"
                    >
                      <span>Read Report</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col justify-between p-3.5 sm:p-4 rounded-xl bg-surface-subtle border border-theme space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs font-mono uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Executive Intelligence Briefing</span>
                  </div>

                  {article.key_takeaways && article.key_takeaways.length > 0 ? (
                    <div className="space-y-2 text-xs text-secondary font-sans leading-relaxed">
                      {article.key_takeaways.slice(0, 3).map((takeaway, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded bg-surface border border-theme text-primary font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="flex-1 line-clamp-2">
                            {takeaway.replace(/\*\*.*?\*\*:?\s*/g, '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-secondary leading-relaxed font-sans line-clamp-3">
                      {cleanTakeaway || article.summary}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-theme flex items-center justify-between text-[11px] font-mono text-muted">
                  <span className="flex items-center gap-1 text-primary font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    FULL REPORT
                  </span>
                  <span>{article.reading_time_minutes || 3} MIN READ</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  // COMPACT / WIRE ITEM VARIANT
  if (variant === 'compact' || variant === 'wire') {
    return (
      <article
        onClick={handleCardClick}
        className={cn(
          'surface-card-hover group cursor-pointer p-3 sm:p-3.5',
          className
        )}
      >
        <div className="flex gap-3 sm:gap-3.5 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 text-[10px] sm:text-[11px] font-mono text-muted uppercase truncate">
              <span className="font-semibold text-primary">{article.source}</span>
              <span>•</span>
              <span>{formatTimeAgo(article.published_at)}</span>
            </div>

            <Link to={articlePath} className="block group-hover:text-amber-500 dark:group-hover:text-amber-200 transition-colors">
              <h3 className="font-editorial text-sm sm:text-base font-bold text-primary leading-snug line-clamp-2">
                {article.title}
              </h3>
            </Link>

            {article.summary && (
              <p className="text-secondary text-xs line-clamp-1 sm:line-clamp-2 mt-1 leading-relaxed">
                {article.summary}
              </p>
            )}
          </div>

          {article.image_url && (
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden flex-shrink-0 bg-surface-subtle border border-theme">
              <img
                src={article.image_url || undefined}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 block"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </article>
    );
  }

  // DEFAULT STANDARD EDITORIAL CARD
  return (
    <article
      onClick={handleCardClick}
      className={cn(
        'surface-card-hover group cursor-pointer overflow-hidden flex flex-col justify-between',
        className
      )}
    >
      <div>
        {/* Card Thumbnail if exists */}
        {article.image_url ? (
          <div className="relative aspect-[16/10] overflow-hidden bg-surface-subtle border-b border-theme">
            <img
              src={article.image_url || undefined}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out block"
              loading="lazy"
            />
            
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider backdrop-blur-md border shadow-sm', categoryColorClass)}>
                {article.category_display || article.category}
              </span>

              {article.is_rumor && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30 backdrop-blur-md">
                  <Flame className="w-3 h-3 text-amber-500" />
                  {article.leaker_name ? `${article.leaker_name}` : 'Leak'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 pb-0 flex items-center justify-between flex-wrap gap-1.5">
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider border shadow-sm', categoryColorClass)}>
              {article.category_display || article.category}
            </span>

            {article.is_rumor && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30">
                <Flame className="w-3 h-3 text-amber-500" />
                {article.leaker_name ? `${article.leaker_name}` : 'Leak'}
              </span>
            )}
          </div>
        )}

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
          {/* Monospace Metadata Row */}
          <div className="flex items-center justify-between text-[11px] font-mono text-muted uppercase">
            <span className="font-semibold text-primary">{article.source}</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{article.reading_time_minutes ? `${article.reading_time_minutes}M` : formatTimeAgo(article.published_at)}</span>
            </div>
          </div>

          {/* Serif Headline */}
          <Link
            to={articlePath}
            className="block group-hover:text-amber-500 dark:group-hover:text-amber-200 transition-colors"
          >
            <h3 className="font-editorial text-base sm:text-lg font-bold tracking-tight text-primary leading-snug line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {/* Clean Summary */}
          {article.summary && (
            <p className="text-secondary text-xs leading-relaxed line-clamp-2 sm:line-clamp-3">
              {article.summary}
            </p>
          )}

          {/* Clean Takeaway highlight if present */}
          {cleanTakeaway && (
            <div className="p-2 sm:p-2.5 rounded-md bg-surface-subtle border border-theme text-[11px] text-secondary leading-relaxed line-clamp-2">
              <span className="text-amber-500 font-semibold font-mono mr-1">KEY:</span>
              {cleanTakeaway}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-t border-theme flex items-center justify-between text-xs text-muted bg-surface-subtle">
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span>{formatTimeAgo(article.published_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-0.5 rounded bg-surface hover:bg-surface-hover border border-theme text-[11px] font-mono text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
            title={`Open original report on ${article.source}`}
          >
            <span>Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <Link
            to={articlePath}
            className="text-primary hover:text-amber-500 font-semibold text-xs inline-flex items-center gap-0.5"
          >
            <span>Read</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}