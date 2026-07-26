'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Apple } from 'lucide-react';

import { SettingsMenu } from '@/components/layout/settings-menu';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const { t, dictionary } = useI18n();

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/products', label: t('nav.devices') },
    { href: '/accessories', label: t('nav.accessories') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-narrow flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Apple className="h-5 w-5" />
          <span>{dictionary.brand.name}</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <SettingsMenu />
          <Link
            href="/login"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            {t('nav.admin')}
          </Link>
        </div>
      </div>
      <nav
        className="container-narrow flex items-center gap-1 overflow-x-auto pb-2 md:hidden"
        aria-label="Primary mobile"
      >
        {navItems.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs whitespace-nowrap',
                active
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
