import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Article, Category, Source, ArticleListResponse } from '../../types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
      ? 'http://localhost:8000'
      : '';

export const newsApi = createApi({
  reducerPath: 'newsApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Article', 'Category', 'Source'],
  endpoints: (builder) => ({
    // Get articles with pagination and filters
    getArticles: builder.query<
      ArticleListResponse,
      { page?: number; pageSize?: number; category?: string; search?: string }
    >({
      query: ({ page = 1, pageSize = 20, category, search }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: pageSize.toString(),
        });
        if (category) params.append('category', category);
        if (search) params.append('search', search);
        return `/api/articles/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.articles.map(({ id }) => ({
                type: 'Article' as const,
                id,
              })),
              { type: 'Article', id: 'PARTIAL-LIST' },
            ]
          : [{ type: 'Article', id: 'PARTIAL-LIST' }],
    }),

    // Get trending articles
    getTrendingArticles: builder.query<Article[], { limit?: number }>({
      query: ({ limit = 10 } = {}) =>
        `/api/articles/trending?limit=${limit}`,
      providesTags: (_result, _err) => [{ type: 'Article', id: 'TRENDING' }],
    }),

    // Get single article by ID
    getArticleById: builder.query<Article, string>({
      query: (id) => `/api/articles/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Article', id }],
    }),

    // Get all categories with counts
    getCategories: builder.query<Category[], void>({
      query: () => '/api/categories/',
      providesTags: ['Category'],
    }),

    // Get all sources
    getSources: builder.query<Source[], { activeOnly?: boolean }>({
      query: ({ activeOnly = true } = {}) =>
        `/api/sources/?active_only=${activeOnly}`,
      providesTags: ['Source'],
    }),

    // Get source by ID
    getSourceById: builder.query<Source, string>({
      query: (id) => `/api/sources/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Source', id }],
    }),

    // Toggle source active status
    toggleSource: builder.mutation<{ success: boolean; active: boolean }, string>({
      query: (id) => ({
        url: `/api/sources/${id}/toggle`,
        method: 'PUT',
      }),
      invalidatesTags: ['Source'],
    }),

    // Add new source
    addSource: builder.mutation<Source, Omit<Source, 'id'>>({
      query: (source) => ({
        url: '/api/sources/',
        method: 'POST',
        body: source,
      }),
      invalidatesTags: ['Source'],
    }),

    // Delete source
    deleteSource: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/api/sources/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Source'],
    }),
  }),
});

export const {
  useGetArticlesQuery,
  useGetTrendingArticlesQuery,
  useGetArticleByIdQuery,
  useGetCategoriesQuery,
  useGetSourcesQuery,
  useGetSourceByIdQuery,
  useToggleSourceMutation,
  useAddSourceMutation,
  useDeleteSourceMutation,
} = newsApi;