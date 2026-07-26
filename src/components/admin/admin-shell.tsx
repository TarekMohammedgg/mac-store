'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChartColumn,
  LayoutDashboard,
  LogOut,
  Package,
  Plug,
  Receipt,
  Settings as SettingsIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { BrandLogo } from '@/components/brand/brand-logo';
import { useI18n } from '@/i18n';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/stores/auth.store';
import { useStoreBrandName } from '@/stores/settings.store';
import { SettingsMenu } from '@/components/layout/settings-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', labelKey: 'nav.dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/sales', labelKey: 'nav.sales', icon: Receipt },
  { href: '/admin/analytics', labelKey: 'nav.analytics', icon: ChartColumn },
  { href: '/admin/products', labelKey: 'nav.products', icon: Package },
  { href: '/admin/accessories', labelKey: 'nav.accessories', icon: Plug },
  { href: '/admin/settings', labelKey: 'nav.settings', icon: SettingsIcon },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, dictionary } = useI18n();
  const brandName = useStoreBrandName(dictionary.brand.name);
  const { session, hydrated } = useAuthGuard();
  const logout = useAuthStore((state) => state.logout);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const activePath = pendingHref ?? pathname;

  React.useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  React.useEffect(() => {
    useAuthStore.setState({ loading: false });
  }, []);

  React.useEffect(() => {
    for (const item of NAV_ITEMS) {
      router.prefetch(item.href);
    }
  }, [router]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace('/login?next=/admin');
      return;
    }
    if (session.role !== 'admin') {
      router.replace('/');
    }
  }, [hydrated, session, router]);

  const handleLogout = async () => {
    await logout();
    toast.success(t('nav.signOut'));
    router.replace('/login');
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  if (!session || session.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-dvh max-w-[100vw] overflow-x-clip bg-muted/30">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r bg-background lg:block">
        <div className="flex h-full flex-col">
          <Link
            href="/"
            className="flex h-16 items-center gap-2.5 border-b px-5 font-semibold tracking-tight"
          >
            <BrandLogo size="md" priority />
            <span className="truncate">{brandName}</span>
          </Link>
          <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(activePath, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => setPendingHref(item.href)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
          <Separator />
          <div className="p-3 text-xs text-muted-foreground">
            <div className="mb-1 truncate font-medium text-foreground">{session.username}</div>
            <div>{t('admin.signedInAs')}</div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-3 backdrop-blur sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin"
              className="flex min-w-0 items-center gap-2 font-semibold tracking-tight lg:hidden"
            >
              <BrandLogo size="sm" />
              <span className="truncate text-sm sm:text-base">{brandName}</span>
            </Link>
            <div className="hidden lg:block">
              <h1 className="text-sm text-muted-foreground">{t('nav.admin')}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <SettingsMenu />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              aria-label={t('nav.signOut')}
              className="px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.signOut')}</span>
            </Button>
          </div>
        </header>
        <nav
          className="flex items-center gap-1 overflow-x-auto overscroll-x-contain border-b bg-background px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
          aria-label="Admin mobile"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(activePath, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => setPendingHref(item.href)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs whitespace-nowrap',
                  active
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <main className="min-w-0 flex-1 overflow-x-clip p-3 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
