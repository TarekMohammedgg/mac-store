import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

import { I18nProvider } from '@/i18n';
import { PasswordInput } from '@/components/ui/password-input';

beforeEach(() => {
  document.cookie = 'macstore_locale=; Max-Age=0; Path=/';
});

afterEach(() => {
  cleanup();
});

describe('PasswordInput', () => {
  it('renders with type="password" by default', () => {
    render(
      <I18nProvider initialLocale="ar">
        <PasswordInput aria-label="Password" />
      </I18nProvider>,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles between password and text when the button is clicked', () => {
    render(
      <I18nProvider initialLocale="ar">
        <PasswordInput aria-label="Password" />
      </I18nProvider>,
    );
    const input = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button');

    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('exposes an aria-label that flips between show and hide', () => {
    render(
      <I18nProvider initialLocale="ar">
        <PasswordInput aria-label="Password" />
      </I18nProvider>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-label', 'إظهار كلمة المرور');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-label', 'إخفاء كلمة المرور');
  });

  it('keeps the toggle out of the tab order', () => {
    render(
      <I18nProvider initialLocale="ar">
        <PasswordInput aria-label="Password" />
      </I18nProvider>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('tabindex', '-1');
  });
});
