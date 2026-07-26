'use client';

import * as React from 'react';

import { useI18n } from '@/i18n';

/**
 * Keeps the <html> lang and dir attributes in sync with the active locale.
 * Renders nothing.
 */
export function LocaleHtmlAttrs() {
  const { locale } = useI18n();

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  return null;
}
