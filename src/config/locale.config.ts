export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ar';

export const LOCALE_LABELS: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
};
