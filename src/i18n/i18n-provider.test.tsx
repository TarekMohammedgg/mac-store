import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';

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

function Probe() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="hello">{t('home.title')}</span>
      <span data-testid="count">{t('products.count', 1)}</span>
      <span data-testid="count-plural">{t('products.count', 5)}</span>
      <span data-testid="unknown">{t('does.not.exist')}</span>
      <button type="button" onClick={() => setLocale('en')}>
        to-en
      </button>
    </div>
  );
}

describe('I18nProvider', () => {
  it('renders the default locale and resolves dictionary keys', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('ar');
    expect(screen.getByTestId('hello').textContent).toBe('أجهزة Apple،');
  });

  it('switches locale and re-renders consumers', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    act(() => {
      screen.getByRole('button', { name: 'to-en' }).click();
    });
    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('hello').textContent).toBe('Apple devices,');
  });

  it('handles pluralization in the count function', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId('count').textContent).toBe('1 جهاز');
    expect(screen.getByTestId('count-plural').textContent).toBe('5 أجهزة');
  });

  it('returns the key when the path is missing', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId('unknown').textContent).toBe('does.not.exist');
  });
});
