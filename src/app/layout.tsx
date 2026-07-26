import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';

import { AuthBootstrap } from '@/components/layout/auth-bootstrap';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { I18nProvider } from '@/i18n';
import { TooltipProvider } from '@/components/ui/tooltip';
import { APP_NAME, APP_DESCRIPTION } from '@/config/app.config';
import { DEFAULT_LOCALE, LOCALE_LABELS } from '@/config/locale.config';

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
  icons: {
    icon: [
      { url: '/favicon-16.png?v=7', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32.png?v=7', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-48.png?v=7', type: 'image/png', sizes: '48x48' },
      { url: '/favicon-64.png?v=7', type: 'image/png', sizes: '64x64' },
      { url: '/favicon-128.png?v=7', type: 'image/png', sizes: '128x128' },
      { url: '/icon-192.png?v=7', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png?v=7', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=7', type: 'image/png', sizes: '180x180' }],
    shortcut: '/favicon-32.png?v=7',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = DEFAULT_LOCALE;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body suppressHydrationWarning>
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
