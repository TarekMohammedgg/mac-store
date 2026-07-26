'use client';

import * as React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';

import { LazyImageGallery } from '@/components/shared/lazy-image-gallery';
import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AccessoryCard } from '@/components/accessories/accessory-card';
import { formatPrice } from '@/lib/format';
import { accessoryService } from '@/services/accessory.service';

export function AccessoryDetailView({ id }: { id: string }) {
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const accessory = useCachedLiveQuery(
    `accessory-detail-${id}`,
    async () => accessoryService.findById(id),
    [id],
  );
  const related = useCachedLiveQuery(
    `accessory-related-${id}-${accessory?.category ?? ''}`,
    async () => {
      if (!accessory) return [];
      const all = await accessoryService.search({ category: accessory.category });
      return all.filter((a) => a.id !== accessory.id).slice(0, 4);
    },
    [accessory?.id, accessory?.category],
  );

  if (accessory === undefined) {
    return (
      <div className="container-narrow py-16 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }
  if (accessory === null) {
    notFound();
  }

  const inStock = accessory.availability && accessory.quantity > 0;

  return (
    <div className="container-narrow py-8 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground">
        <Link href="/accessories">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('accessory.backToAccessories')}
        </Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-2">
        <LazyImageGallery
          imageIds={[accessory.coverImageId, ...accessory.imageIds].filter(
            (id): id is string => Boolean(id),
          )}
          alt={accessory.name}
        />

        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {labels.accessoryCategory(accessory.category)}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {accessory.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={inStock ? 'success' : 'destructive'}>
                {inStock ? t('accessory.inStock') : t('accessory.outOfStock')}
              </Badge>
              <Badge variant="outline">
                {accessory.quantity} {t('accessory.unitsAvailable')}
              </Badge>
            </div>
          </div>

          <div className="text-4xl font-semibold tracking-tight">
            {formatPrice(accessory.price)}
          </div>

          <Separator />

          {accessory.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('accessory.description')}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {accessory.description}
              </p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" /> {t('accessory.stock')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('accessory.availableUnits')}</span>
                <span className="font-medium">{accessory.quantity}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">{t('accessory.related')}</h2>
            <Link
              href="/accessories"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              {t('home.viewAll')}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((a) => (
              <AccessoryCard key={a.id} accessory={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
