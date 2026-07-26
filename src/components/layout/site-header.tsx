'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { BrandLogo } from '@/components/brand/brand-logo';
import { SettingsMenu } from '@/components/layout/settings-menu';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { useStoreBrandName } from '@/stores/settings.store';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, dictionary } = useI18n();
  const brandName = useStoreBrandName(dictionary.brand.name);
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = session?.role === 'admin';

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/products', label: t('nav.devices') },
    { href: '/accessories', label: t('nav.accessories') },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success(t('nav.signOut'));
    router.replace('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-narrow flex h-16 items-center justify-between gap-2">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight"
        >
          <BrandLogo size="md" priority />
          <span className="truncate">{brandName}</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
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
        <div className="flex shrink-0 items-center gap-1">
          <SettingsMenu />
          {isAdmin ? (
            <Button asChild variant="ghost" size="icon" aria-label={t('nav.dashboard')}>
              <Link href="/admin" prefetch>
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          {session ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.signOut')}</span>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/login" prefetch>
                {t('nav.signIn')}
              </Link>
            </Button>
          )}
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
              prefetch
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
