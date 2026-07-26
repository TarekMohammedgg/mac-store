'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Apple,
  LayoutDashboard,
  LogOut,
  Package,
  Plug,
  Settings as SettingsIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/i18n';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/stores/auth.store';
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
  { href: '/admin/products', labelKey: 'nav.products', icon: Package },
  { href: '/admin/accessories', labelKey: 'nav.accessories', icon: Plug },
  { href: '/admin/settings', labelKey: 'nav.settings', icon: SettingsIcon },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t, dictionary } = useI18n();
  const { session, isAuthenticated, checking, initialized } = useAuthGuard();
  const logout = useAuthStore((state) => state.logout);
  const [pathname, setPathname] = React.useState<string>('');

  React.useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  React.useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.replace('/login');
    }
  }, [initialized, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    toast.success(t('nav.signOut'));
    router.replace('/login');
  };

  if (checking || !initialized || !isAuthenticated || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-background lg:block">
        <div className="flex h-full flex-col">
          <Link
            href="/"
            className="flex h-16 items-center gap-2 border-b px-5 font-semibold tracking-tight"
          >
            <Apple className="h-5 w-5" /> {dictionary.brand.name}
          </Link>
          <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
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

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-semibold tracking-tight lg:hidden"
            >
              <Apple className="h-5 w-5" /> {dictionary.brand.name}
            </Link>
            <div className="hidden lg:block">
              <h1 className="text-sm text-muted-foreground">{t('nav.admin')}</h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> {t('nav.signOut')}
          </Button>
        </header>
        <nav
          className="flex items-center gap-1 overflow-x-auto border-b bg-background px-4 py-2 lg:hidden"
          aria-label="Admin mobile"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap',
                  active
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
