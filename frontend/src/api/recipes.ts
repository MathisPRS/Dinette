import api from './client';
import type { Recipe, RecipeSummary, PaginatedResponse, RecipeFilters, RecipeFormData } from '@/types';

export const recipeApi = {
  list: (filters: RecipeFilters = {}) => {
    const params: Record<string, string | number> = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.tags?.length) params.tags = filters.tags.join(',');
    if (filters.ingredient) params.ingredient = filters.ingredient;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    return api.get<PaginatedResponse<RecipeSummary>>('/recipes', { params }).then((r) => r.data);
  },

  get: (id: string) => api.get<Recipe>(`/recipes/${id}`).then((r) => r.data),

  create: (data: RecipeFormData) =>
    api.post<Recipe>('/recipes', data).then((r) => r.data),

  update: (id: string, data: Partial<RecipeFormData>) =>
    api.put<Recipe>(`/recipes/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/recipes/${id}`),

  uploadImage: (recipeId: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api
      .post<{ coverImage: string }>(`/recipes/${recipeId}/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  suggest: (category?: string) =>
    api
      .get<Recipe>('/recipes/suggest', { params: category ? { category } : {} })
      .then((r) => r.data),
};
