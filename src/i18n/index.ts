import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/config/locale.config';

import { ar } from './dictionaries/ar';
import { en } from './dictionaries/en';
import type { Dictionary } from './dictionary.types';

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function resolveLocaleFromString(value: string | undefined | null): Locale {
  if (value && (LOCALES as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

export { I18nProvider, useI18n, type Interpolator } from './i18n-provider';
export type { Dictionary } from './dictionary.types';
