import type { Category } from '@/types';

export const CATEGORY_LABELS: Record<Category, string> = {
  STARTER: 'Entrée',
  MAIN: 'Plat principal',
  DESSERT: 'Dessert',
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  STARTER: '🥗',
  MAIN: '🍽️',
  DESSERT: '🍰',
};

export function formatTime(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getImageUrl(path?: string): string {
  if (!path) return '/placeholder-recipe.jpg';
  if (path.startsWith('http')) return path;
  return path;
}

export function extractApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { error?: string } } }).response;
    return res?.data?.error ?? 'Une erreur est survenue';
  }
  return 'Une erreur est survenue';
}
