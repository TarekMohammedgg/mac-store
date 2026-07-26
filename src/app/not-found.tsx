'use client';

import Link from 'next/link';
import { Apple } from 'lucide-react';

import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const { t, dictionary } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <Apple className="h-5 w-5" /> {dictionary.brand.name}
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">{t('errors.notFoundTitle')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('errors.notFoundDescription')}</p>
      <Button asChild>
        <Link href="/">{t('common.backToCatalog')}</Link>
      </Button>
    </div>
  );
}
