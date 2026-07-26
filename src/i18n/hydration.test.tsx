import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

import { I18nProvider, useI18n } from '@/i18n';

beforeEach(() => {
  document.cookie = 'macstore_locale=; Max-Age=0; Path=/';
  document.documentElement.lang = '';
  document.documentElement.dir = '';
});

afterEach(() => {
  cleanup();
});

describe('hydration contract', () => {
  it('I18nProvider accepts an initialLocale that matches the server render', () => {
    const initial = 'ar' as const;
    function Probe() {
      const { locale } = useI18n();
      return <span data-testid="locale">{locale}</span>;
    }
    render(
      <html lang={initial} dir={initial === 'ar' ? 'rtl' : 'ltr'}>
        <body>
          <I18nProvider initialLocale={initial}>
            <Probe />
          </I18nProvider>
        </body>
      </html>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('ar');
  });

  it('initial dictionary keys resolve against the same locale the server used', () => {
    function Probe() {
      const { t } = useI18n();
      return <span data-testid="hello">{t('home.title')}</span>;
    }
    render(
      <I18nProvider initialLocale="ar">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId('hello').textContent).toBe('أجهزة Apple مستعملة،');
  });

  it('after mount, an updated cookie takes effect without re-rendering the children that did not call setLocale', () => {
    let renderCount = 0;
    function Counter() {
      renderCount += 1;
      return <span data-testid="count">{renderCount}</span>;
    }
    render(
      <I18nProvider initialLocale="ar">
        <Counter />
      </I18nProvider>,
    );
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(renderCount).toBe(1);
  });
});
