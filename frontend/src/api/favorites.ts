import api from './client';
import type { RecipeSummary } from '@/types';

export const favoritesApi = {
  list: () => api.get<{ data: RecipeSummary[] }>('/favorites').then((r) => r.data.data),
  add: (recipeId: string) => api.post(`/favorites/${recipeId}`),
  remove: (recipeId: string) => api.delete(`/favorites/${recipeId}`),
};
