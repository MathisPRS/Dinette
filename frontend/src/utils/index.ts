import type { Category } from '@/types';
import { useI18nStore } from '@/i18n';
import { fr } from '@/i18n/messages_fr';
import { en } from '@/i18n/messages_en';

// Static fallback for non-hook contexts (always French)
export const CATEGORY_LABELS: Record<Category, string> = {
  STARTER: fr.category_starter,
  MAIN: fr.category_main,
  DESSERT: fr.category_dessert,
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  STARTER: '🥗',
  MAIN: '🍽️',
  DESSERT: '🍰',
};

/** Returns locale-aware category labels (use inside React components). */
export function useCategoryLabels(): Record<Category, string> {
  const locale = useI18nStore((s) => s.locale);
  const m = locale === 'en' ? en : fr;
  return {
    STARTER: m.category_starter,
    MAIN: m.category_main,
    DESSERT: m.category_dessert,
  };
}

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
    return res?.data?.error ?? fr.error_generic;
  }
  return fr.error_generic;
}
