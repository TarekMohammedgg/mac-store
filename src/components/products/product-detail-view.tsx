'use client';

import * as React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Battery, CheckCircle2, Cpu, HardDrive, MemoryStick } from 'lucide-react';

import { LazyImageGallery } from '@/components/shared/lazy-image-gallery';
import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/products/product-card';
import { formatPrice, formatRam, formatStorage } from '@/lib/format';
import { productService } from '@/services/product.service';

export function ProductDetailView({ id }: { id: string }) {
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const product = useCachedLiveQuery(
    `product-detail-${id}`,
    async () => productService.findById(id),
    [id],
  );
  const related = useCachedLiveQuery(
    `product-related-${id}-${product?.category ?? ''}`,
    async () => {
      if (!product) return [];
      const all = await productService.search({ category: product.category });
      return all.filter((p) => p.id !== product.id).slice(0, 4);
    },
    [product?.id, product?.category],
  );

  if (product === undefined) {
    return (
      <div className="container-narrow py-16 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }
  if (product === null) {
    notFound();
  }

  return (
    <div className="container-narrow py-8 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('product.backToDevices')}
        </Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-2">
        <LazyImageGallery
          imageIds={[product.coverImageId, ...product.imageIds].filter(
            (id): id is string => Boolean(id),
          )}
          alt={product.model}
        />

        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {labels.productCategory(product.category)}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {product.model}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  product.availability === 'available'
                    ? 'success'
                    : product.availability === 'sold'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {labels.availability(product.availability)}
              </Badge>
              <Badge variant="outline">{labels.condition(product.condition)}</Badge>
            </div>
          </div>

          <div>
            <div className="text-4xl font-semibold tracking-tight">
              {formatPrice(product.price)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t('product.inStockHint')}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <SpecItem icon={<Cpu className="h-4 w-4" />} label={t('product.specs.cpu')} value={product.cpu} />
            <SpecItem
              icon={<MemoryStick className="h-4 w-4" />}
              label={t('product.specs.ram')}
              value={formatRam(product.ram)}
            />
            <SpecItem
              icon={<HardDrive className="h-4 w-4" />}
              label={t('product.specs.storage')}
              value={`${formatStorage(product.storage)} ${product.storageType}`}
            />
            {product.batteryHealth !== null && (
              <SpecItem
                icon={<Battery className="h-4 w-4" />}
                label={t('product.specs.battery')}
                value={`${product.batteryHealth}%`}
              />
            )}
            {product.cycleCount !== null && (
              <SpecItem
                icon={<Battery className="h-4 w-4" />}
                label={t('product.specs.cycleCount')}
                value={String(product.cycleCount)}
              />
            )}
            <SpecItem
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={t('product.specs.condition')}
              value={labels.condition(product.condition)}
            />
          </div>

          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('product.description')}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {product.description}
              </p>
            </div>
          )}

          {Object.keys(product.specifications).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('product.specifications')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 pt-0 text-sm sm:grid-cols-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between border-b pb-1 last:border-0 last:pb-0"
                  >
                    <span className="text-muted-foreground">{key}</span>
                    <span className="text-end font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">{t('product.related')}</h2>
            <Link
              href="/products"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              {t('home.viewAll')}
            </Link>
          </div>
          <div className="catalog-grid-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
