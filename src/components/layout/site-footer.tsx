'use client';

import Link from 'next/link';
import { Apple } from 'lucide-react';

import { useI18n } from '@/i18n';

export function SiteFooter() {
  const { t, dictionary } = useI18n();
  return (
    <footer className="mt-16 border-t">
      <div className="container-narrow flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Apple className="h-4 w-4" />
          <span>
            {dictionary.brand.name} · {t('home.badge')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-foreground">
            {t('nav.devices')}
          </Link>
          <Link href="/accessories" className="hover:text-foreground">
            {t('nav.accessories')}
          </Link>
          <Link href="/login" className="hover:text-foreground">
            {t('nav.admin')}
          </Link>
        </div>
      </div>
      <div className="container-narrow pb-8 text-xs text-muted-foreground">
        {t('footer.notice')}
      </div>
    </footer>
  );
}
