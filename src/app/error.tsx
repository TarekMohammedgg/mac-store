'use client';

import * as React from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  React.useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  const isConfig = /supabase env|NEXT_PUBLIC_SUPABASE|Configuration required/i.test(error.message);
  const isNetwork = /Cannot reach Supabase|failed to fetch|network|Connection problem/i.test(
    error.message,
  );
  const title = isConfig
    ? t('errors.configTitle')
    : isNetwork
      ? t('errors.networkTitle')
      : t('errors.globalTitle');
  const description = isConfig
    ? error.message || t('errors.configDescription')
    : isNetwork
      ? error.message || t('errors.networkDescription')
      : t('errors.globalDescription');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      <Button onClick={reset}>{t('common.retry')}</Button>
    </div>
  );
}
