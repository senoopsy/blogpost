import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  Share2,
  ExternalLink,
  Flame,
  Volume2,
  VolumeX,
  Check,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowUpRight,
  Globe,
  User,
  Eye,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { useGetArticleByIdQuery, useGetArticlesQuery } from '../store/api/newsApi';
import { ArticleCard } from '../components/article/ArticleCard';
import { ArticleCardSkeleton } from '../components/ui/Skeletons';
import { getCategoryColor, formatTimeAgo, formatDate } from '../lib/utils';

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();

  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');

  const { data: article, isLoading, error } = useGetArticleByIdQuery(id || '', {
    skip: !id,
  });

  const { data: relatedData } = useGetArticlesQuery(
    {
      category: article?.category,
      pageSize: 4,
    },
    { skip: !article?.category }
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    if (!article) return;
    const text = encodeURIComponent(`${article.title} via Senoopsy`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    if (!article) return;
    const text = encodeURIComponent(`${article.title} - Read more on Senoopsy: ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const toggleSpeech = () => {
    if (!article || !window.speechSynthesis) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const cleanSummary = article.summary || '';
      const cleanTakeaways = article.key_takeaways?.map(t => t.replace(/\*\*.*?\*\*:?\s*/g, '')).join('. ') || '';
      const textToRead = `${article.title}. ${cleanSummary}. Key highlights: ${cleanTakeaways}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-5 w-28 skeleton rounded-md mb-3" />
        <ArticleCardSkeleton variant="featured" />
        <div className="space-y-3 pt-4">
          <div className="h-4 w-full skeleton rounded" />
          <div className="h-4 w-5/6 skeleton rounded" />
          <div className="h-4 w-4/6 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="surface-card p-8 sm:p-12 max-w-lg mx-auto">
          <h2 className="font-editorial text-2xl font-bold mb-2 text-primary">Report Not Found</h2>
          <p className="text-secondary text-xs mb-6">The requested technical report could not be found or has moved.</p>
          <Link to="/" className="btn-primary text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Senoopsy Wire
          </Link>
        </div>
      </div>
    );
  }

  const categoryColorClass = getCategoryColor(article.category);
  const readingTime = article.reading_time_minutes || 3;
  const filteredRelated = relatedData?.articles.filter((a) => a.id !== article.id).slice(0, 3) || [];

  const renderMarkdownContent = (content: string) => {
    const sections = content.split('\n\n');
    return sections.map((section, idx) => {
      const trimmed = section.trim();
      
      // H2 Section Heading
      if (trimmed.startsWith('## ')) {
        return (
          <h2
            key={idx}
            className="font-editorial text-xl sm:text-2xl lg:text-3xl font-bold text-primary tracking-tight mt-8 sm:mt-12 mb-3 sm:mb-4 pt-4 sm:pt-6 border-t border-theme"
          >
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      
      // H3 Subheading
      if (trimmed.startsWith('### ')) {
        return (
          <h3
            key={idx}
            className="font-editorial text-lg sm:text-xl font-bold text-primary mt-6 mb-2.5"
          >
            {trimmed.replace('### ', '')}
          </h3>
        );
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            className="my-6 sm:my-8 pl-4 sm:pl-5 py-2.5 sm:py-3 border-l-2 border-amber-500 italic text-secondary text-sm sm:text-base leading-relaxed bg-surface-subtle rounded-r-lg font-editorial"
          >
            {trimmed.replace(/^>\s*/gm, '')}
          </blockquote>
        );
      }

      // Unordered list / specs list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n');
        return (
          <div key={idx} className="my-5 p-4 sm:p-5 rounded-xl bg-surface-subtle border border-theme">
            <ul className="space-y-2">
              {items.map((item, itemIdx) => {
                const cleanItem = item.replace(/^[-*]\s+/, '');
                const parts = cleanItem.split(':**');
                if (parts.length === 2) {
                  return (
                    <li key={itemIdx} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 text-xs sm:text-sm text-secondary font-mono">
                      <span className="text-primary font-semibold flex-shrink-0 sm:min-w-[130px]">
                        {parts[0].replace('**', '')}:
                      </span>
                      <span className="text-secondary font-sans">
                        {parts[1]}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={itemIdx} className="flex items-start gap-2 text-xs sm:text-sm text-secondary">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{cleanItem}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }

      // Standard Paragraph
      return (
        <p
          key={idx}
          className={`leading-relaxed text-secondary mb-4 sm:mb-6 font-sans ${
            fontSize === 'large'
              ? 'text-base sm:text-lg leading-loose'
              : fontSize === 'xl'
              ? 'text-lg sm:text-xl leading-loose'
              : 'text-sm sm:text-base leading-relaxed'
          }`}
        >
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-20">
      {/* Editorial Navigation Bar */}
      <div className="border-b border-theme bg-surface py-2.5 sm:py-3 transition-colors">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-mono text-muted">
          <nav className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
            <Link to="/" className="hover:text-primary transition-colors">SENOOPSY</Link>
            <ChevronRight className="w-3 h-3 text-muted/50" />
            <Link to={`/?category=${article.category}`} className="text-primary font-semibold uppercase hover:underline truncate">
              {article.category_display || article.category}
            </Link>
          </nav>

          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-mono text-secondary hover:text-primary transition-colors px-2.5 py-1 rounded-md border border-theme flex-shrink-0"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">All Reports</span>
          </Link>
        </div>
      </div>

      {/* Main Editorial Article Container */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <article className="surface-card p-4 sm:p-8 lg:p-12">
          
          {/* Header Metadata Chips */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6 flex-wrap">
            <span className={`px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider border ${categoryColorClass}`}>
              {article.category_display || article.category}
            </span>

            {article.is_rumor && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                {article.leaker_name ? `${article.leaker_name} Supply Chain Intel` : 'Verified Leak'}
              </span>
            )}

            {article.confidence_score && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {article.confidence_score}% Accuracy
              </span>
            )}
          </div>

          {/* Article Main Serif Headline */}
          <h1 className="font-editorial text-2xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight leading-[1.18] mb-4 sm:mb-6">
            {article.title}
          </h1>

          {/* Editorial Byline Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 sm:py-4 mb-6 sm:mb-8 border-y border-theme text-xs text-muted font-mono">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-surface-subtle border border-theme flex items-center justify-center">
                  <Globe className="w-3 h-3 text-primary" />
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:text-amber-500 transition-colors inline-flex items-center gap-1 group/src font-sans text-xs"
                  title={`Open original report on ${article.source}`}
                >
                  <span>{article.source}</span>
                  <ExternalLink className="w-3 h-3 text-muted group-hover/src:text-amber-500 transition-colors" />
                </a>
              </div>

              {article.author && (
                <>
                  <span className="text-muted/40">•</span>
                  <div className="flex items-center gap-1 font-sans">
                    <User className="w-3 h-3" />
                    <span>{article.author}</span>
                  </div>
                </>
              )}

              <span className="text-muted/40">•</span>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3" />
                <span>{readingTime} MIN</span>
                <span>({formatTimeAgo(article.published_at)})</span>
              </div>
            </div>

            {article.views > 0 && (
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <Eye className="w-3 h-3" />
                <span>{article.views.toLocaleString()} reads</span>
              </div>
            )}
          </div>

          {/* Interactive Reader Toolbar (Mobile Responsive Grouping) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2.5 sm:p-3 mb-8 sm:mb-10 rounded-xl bg-surface-subtle border border-theme gap-2.5 sm:gap-3">
            {/* Audio + Font Size */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <button
                onClick={toggleSpeech}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                  isPlayingAudio
                    ? 'bg-primary text-canvas font-bold'
                    : 'bg-surface hover:bg-surface-hover border border-theme text-secondary'
                }`}
              >
                {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isPlayingAudio ? 'Stop Narrator' : 'Listen Story'}</span>
              </button>

              <div className="h-4 w-px bg-theme mx-1 hidden sm:block" />

              <div className="flex items-center gap-1 text-xs text-muted font-mono">
                <span className="text-[10px] mr-1 hidden sm:inline">TYPE:</span>
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-2 py-0.5 rounded text-xs ${fontSize === 'normal' ? 'bg-primary text-canvas font-bold' : 'hover:text-primary'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-0.5 rounded text-xs ${fontSize === 'large' ? 'bg-primary text-canvas font-bold' : 'hover:text-primary'}`}
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize('xl')}
                  className={`px-2 py-0.5 rounded text-xs ${fontSize === 'xl' ? 'bg-primary text-canvas font-bold' : 'hover:text-primary'}`}
                >
                  A++
                </button>
              </div>
            </div>

            {/* Actions + Original Source */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 flex-wrap">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`p-1.5 rounded-md border border-theme transition-all ${
                  bookmarked ? 'bg-primary text-canvas' : 'bg-surface hover:bg-surface-hover text-secondary hover:text-primary'
                }`}
                title="Bookmark Report"
              >
                {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>

              <button
                onClick={handleShareTwitter}
                className="p-1.5 rounded-md bg-surface hover:bg-surface-hover border border-theme text-secondary hover:text-primary transition-colors"
                title="Share to X"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="p-1.5 rounded-md bg-surface hover:bg-surface-hover border border-theme text-secondary hover:text-primary transition-colors"
                title="Share to WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>

              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 rounded-md bg-surface hover:bg-surface-hover border border-theme text-xs font-mono flex items-center gap-1 text-secondary transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs font-mono py-1.5 px-3 flex-1 sm:flex-initial text-center"
                title={`Open original source report on ${article.source}`}
              >
                <span>Original Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Executive Briefing Takeaways Box */}
          {article.key_takeaways && article.key_takeaways.length > 0 && (
            <div className="mb-8 sm:mb-10 p-4 sm:p-6 lg:p-8 rounded-xl bg-surface-subtle border border-theme">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 text-primary">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-editorial font-bold text-base sm:text-lg lg:text-xl tracking-tight">
                  Executive Briefing & Key Takeaways
                </h3>
              </div>

              <div className="space-y-3">
                {article.key_takeaways.map((takeaway, tIdx) => {
                  const cleanTakeaway = takeaway.replace(/\*\*/g, '');
                  return (
                    <div key={tIdx} className="flex items-start gap-2.5 sm:gap-3.5 text-xs sm:text-sm lg:text-base leading-relaxed text-secondary font-sans">
                      <span className="w-5 h-5 rounded-md bg-surface border border-theme text-primary font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {tIdx + 1}
                      </span>
                      <p className="flex-1">
                        {cleanTakeaway}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hero Feature Media */}
          {article.image_url && (
            <div className="mb-8 sm:mb-10 rounded-xl overflow-hidden border border-theme bg-surface-subtle">
              <div className="relative aspect-[16/10] max-h-[450px] w-full">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-3 sm:px-4 py-2 bg-surface-subtle text-[10px] sm:text-[11px] font-mono text-muted flex items-center justify-between border-t border-theme">
                <span className="truncate mr-2">Source: {article.source}</span>
                <span className="whitespace-nowrap">SENOOPSY DESK</span>
              </div>
            </div>
          )}

          {/* Main Article Body */}
          <div className="editorial-body font-sans space-y-4 sm:space-y-6">
            {article.content ? (
              renderMarkdownContent(article.content)
            ) : (
              <div className="space-y-4 text-sm sm:text-base text-secondary leading-relaxed">
                <p>{article.summary}</p>
              </div>
            )}
          </div>

          {/* Additional Inline Gallery */}
          {article.images && article.images.length > 1 && (
            <div className="my-8 sm:my-10 pt-6 border-t border-theme">
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-primary mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted" />
                Additional Gallery & Renders
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {article.images.slice(1, 5).map((img, i) => (
                  <div key={i} className="rounded-lg overflow-hidden aspect-[16/10] bg-surface-subtle border border-theme">
                    <img src={img} alt={`Render ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deep Dive Callout with Original Link */}
          <div className="mt-8 sm:mt-12 p-4 sm:p-6 lg:p-8 rounded-xl bg-surface-subtle border border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5">
            <div className="space-y-1">
              <h4 className="font-editorial text-sm sm:text-base font-bold text-primary flex items-center gap-2">
                <span>Want to explore the unabridged primary reporting?</span>
              </h4>
              <p className="text-xs text-muted max-w-xl leading-relaxed font-sans">
                Read the original publication, live comments, and video embeds directly on <span className="text-primary font-semibold">{article.source}</span>.
              </p>
            </div>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-4 py-2 text-xs font-semibold whitespace-nowrap w-full sm:w-auto text-center"
            >
              <span>Read on {article.source}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Editorial Footer & Attribution */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted font-mono">
            <div>
              <p className="text-primary font-semibold font-sans">
                Senoopsy Editorial Intelligence Desk
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[11px]">
                Synthesized from original investigative reporting by <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{article.source}</a> ({formatDate(article.published_at)}).
              </p>
            </div>

            <button
              onClick={handleCopyLink}
              className="btn-secondary px-3.5 py-1.5 text-xs font-semibold"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Report
            </button>
          </div>
        </article>
      </div>

      {/* Related Stories Grid */}
      {filteredRelated.length > 0 && (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 mt-10 sm:mt-14">
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-2 border-b border-theme">
            <h3 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-primary">
              Related in {article.category_display || article.category}
            </h3>
            <Link
              to={`/?category=${article.category}`}
              className="text-xs font-mono text-primary hover:text-secondary transition-colors inline-flex items-center gap-1"
            >
              Explore Category <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {filteredRelated.map((relatedArticle) => (
              <ArticleCard key={relatedArticle.id} article={relatedArticle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}