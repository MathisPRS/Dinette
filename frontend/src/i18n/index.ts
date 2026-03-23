import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fr } from './messages_fr';
import { en } from './messages_en';
import type { Messages } from './messages_fr';

export type Locale = 'fr' | 'en';

const messages: Record<Locale, Messages> = { fr, en };

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'fr',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'dinette-locale' }
  )
);

/** Returns the translation function for the current locale. */
export function useT(): (key: keyof Messages, vars?: Record<string, string | number>) => string {
  const locale = useI18nStore((s) => s.locale);
  const m = messages[locale];
  return (key, vars) => {
    let str: string = m[key] as string;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  };
}
