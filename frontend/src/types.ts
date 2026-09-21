export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  source_logo?: string | null;
  author?: string | null;
  summary?: string | null;
  ai_summary?: string | null;
  content?: string | null;
  image_url?: string | null;
  images?: string[];
  category: string;
  category_display?: string;
  tags: string[];
  key_takeaways?: string[];
  is_rumor?: boolean;
  leaker_name?: string | null;
  confidence_score?: number | null;
  specs?: Record<string, string> | null;
  reading_time_minutes?: number;
  ai_enhanced?: boolean;
  published_at: string;
  fetched_at: string;
  views: number;
  trending_score: number;
  time_ago: string;
}

export interface Category {
  value: string;
  label: string;
  count: number;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  rss_url: string;
  category: string;
  logo_url?: string | null;
  active: boolean;
  description?: string | null;
  language: string;
  country: string;
  created_at: string;
  updated_at: string;
  last_fetched?: string | null;
  fetch_count: number;
  error_count: number;
}

export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}