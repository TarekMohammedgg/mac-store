import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Toaster } from 'sonner';

import { AuthBootstrap } from '@/components/layout/auth-bootstrap';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { I18nProvider } from '@/i18n';
import { TooltipProvider } from '@/components/ui/tooltip';
import { APP_NAME, APP_DESCRIPTION } from '@/config/app.config';
import { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS, type Locale } from '@/config/locale.config';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: APP_NAME }],
  generator: APP_NAME,
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const LOCALE_COOKIE = 'macstore_locale';

async function resolveLocale(): Promise<Locale> {
  const store = await cookies();
  const stored = store.get(LOCALE_COOKIE)?.value;
  if (stored && (LOCALES as readonly string[]).includes(stored)) {
    return stored as Locale;
  }
  return DEFAULT_LOCALE;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider initialLocale={locale}>
            <AuthBootstrap>
              <TooltipProvider delayDuration={150}>
                {children}
                <Toaster richColors closeButton position="bottom-right" />
              </TooltipProvider>
            </AuthBootstrap>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

void LOCALE_LABELS;
