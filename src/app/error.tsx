'use client';

import * as React from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';

export default function GlobalError({
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t('errors.globalTitle')}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t('errors.globalDescription')}</p>
      <Button onClick={reset}>{t('common.retry')}</Button>
    </div>
  );
}
