import api from './client';
import type { ExternalRecipe } from '@/types';

export interface ExternalSearchParams {
  ingredient: string;
  category?: string;
  area?: string;
}

export interface MealIngredient {
  nameEn: string;
  nameFr: string;
}

export const suggestApi = {
  search: (params: ExternalSearchParams) =>
    api
      .get<{ meals: ExternalRecipe[] }>('/suggest/search', { params })
      .then((r) => r.data.meals),

  detail: (id: string, locale = 'en') =>
    api
      .get<{ meal: ExternalRecipe }>(`/suggest/detail/${encodeURIComponent(id)}`, { params: { locale } })
      .then((r) => r.data.meal),

  categories: () =>
    api
      .get<{ categories: string[] }>('/suggest/categories')
      .then((r) => r.data.categories),

  areas: () =>
    api
      .get<{ areas: string[] }>('/suggest/areas')
      .then((r) => r.data.areas),

  /** Returns all MealIngredient rows from DB (nameEn + nameFr) */
  ingredients: () =>
    api
      .get<{ ingredients: MealIngredient[] }>('/suggest/ingredients')
      .then((r) => r.data.ingredients),

  /** Translate an array of English strings to the target language (default fr) */
  translate: (texts: string[], target = 'fr') =>
    api
      .post<{ translations: string[] }>('/suggest/translate', { texts, target })
      .then((r) => r.data.translations),
};
