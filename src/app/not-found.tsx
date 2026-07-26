'use client';

import Link from 'next/link';

import { BrandLogo } from '@/components/brand/brand-logo';
import { useI18n } from '@/i18n';
import { useStoreBrandName } from '@/stores/settings.store';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const { t, dictionary } = useI18n();
  const brandName = useStoreBrandName(dictionary.brand.name);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
        <BrandLogo size="lg" alt={brandName} priority />
        <span>{brandName}</span>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">{t('errors.notFoundTitle')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('errors.notFoundDescription')}</p>
      <Button asChild>
        <Link href="/">{t('common.backToCatalog')}</Link>
      </Button>
    </div>
  );
}
