'use client';

import * as React from 'react';

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/config/locale.config';

import { ar } from './dictionaries/ar';
import { en } from './dictionaries/en';
import type { Dictionary } from './dictionary.types';

const dictionaries: Record<Locale, Dictionary> = { en, ar };

const COOKIE_NAME = 'macstore_locale';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const target = `${name}=`;
  const parts = document.cookie ? document.cookie.split('; ') : [];
  for (const part of parts) {
    if (part.startsWith(target)) {
      return decodeURIComponent(part.slice(target.length));
    }
  }
  return null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function isValidLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as readonly string[]).includes(value);
}

type InterpolationValue = string | number;

export type Interpolator = (
  key: string,
  ...args: (InterpolationValue | Record<string, InterpolationValue>)[]
) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

interface I18nContextValue extends LocaleContextValue {
  dictionary: Dictionary;
  t: Interpolator;
}

function resolveKey(dictionary: Dictionary, key: string): unknown {
  const parts = key.split('.');
  let current: unknown = dictionary;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function format(
  template: string,
  args: (InterpolationValue | Record<string, InterpolationValue>)[],
): string {
  if (args.length === 0) return template;
  const last = args[args.length - 1];
  if (last && typeof last === 'object' && !Array.isArray(last)) {
    return template.replace(/\{(\w+)\}/g, (match, name: string) => {
      const value = (last as Record<string, InterpolationValue>)[name];
      return value === undefined ? match : String(value);
    });
  }
  return template.replace(/\{(\d+)\}/g, (match, index: string) => {
    const idx = Number(index);
    const value = args[idx];
    return value === undefined ? match : String(value);
  });
}

function applyDocumentLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

function buildT(dictionary: Dictionary): Interpolator {
  return (key, ...args) => {
    const value = resolveKey(dictionary, key);
    if (typeof value === 'string') {
      return format(value, args);
    }
    if (typeof value === 'function') {
      return String((value as (...params: unknown[]) => unknown)(...args));
    }
    return key;
  };
}

const LocaleContext = React.createContext<LocaleContextValue | undefined>(undefined);
const DictionaryContext = React.createContext<Dictionary | undefined>(undefined);
const TContext = React.createContext<Interpolator | undefined>(undefined);

const DEFAULT_DICTIONARY = dictionaries[DEFAULT_LOCALE];
const DEFAULT_T: Interpolator = (key) => key;
const FALLBACK_LOCALE: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
};

interface I18nProviderProps {
  children: React.ReactNode;
  /**
   * The locale the server already rendered with. The provider starts in this
   * state to avoid hydration mismatches on the <html> element. After mount
   * it reads the cookie as a final source of truth.
   */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  React.useEffect(() => {
    const stored = readCookie(COOKIE_NAME);
    const resolved = isValidLocale(stored) ? stored : (initialLocale ?? DEFAULT_LOCALE);
    setLocaleState((current) => (current === resolved ? current : resolved));
    applyDocumentLocale(resolved);
  }, [initialLocale]);

  React.useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    writeCookie(COOKIE_NAME, next);
    applyDocumentLocale(next);
  }, []);

  const dictionary = dictionaries[locale] ?? DEFAULT_DICTIONARY;
  const t = React.useMemo(() => buildT(dictionary), [dictionary]);

  const localeValue = React.useMemo<LocaleContextValue>(
    () => ({ locale, setLocale }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={localeValue}>
      <DictionaryContext.Provider value={dictionary}>
        <TContext.Provider value={t}>{children}</TContext.Provider>
      </DictionaryContext.Provider>
    </LocaleContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const localeCtx = React.useContext(LocaleContext) ?? FALLBACK_LOCALE;
  const dictionary = React.useContext(DictionaryContext) ?? DEFAULT_DICTIONARY;
  const t = React.useContext(TContext) ?? DEFAULT_T;
  return { ...localeCtx, dictionary, t };
}

export function useLocale(): LocaleContextValue {
  return React.useContext(LocaleContext) ?? FALLBACK_LOCALE;
}

export function useT(): Interpolator {
  return React.useContext(TContext) ?? DEFAULT_T;
}

export function useDictionary(): Dictionary {
  return React.useContext(DictionaryContext) ?? DEFAULT_DICTIONARY;
}
