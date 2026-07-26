'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';

export function HomeHero() {
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';

  return (
    <section className="container-narrow py-16 sm:py-24">
      <div className="flex flex-col items-start gap-6">
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1 text-xs uppercase tracking-wider"
        >
          {t('home.badge')}
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          {t('home.title')}
          <br />
          <span className="text-muted-foreground">{t('home.titleAccent')}</span>
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          {t('home.description')}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/products" prefetch>
              {t('home.browseDevices')}{' '}
              <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/accessories" prefetch>
              {t('home.browseAccessories')}{' '}
              <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
