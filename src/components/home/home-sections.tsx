'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Laptop, Plug, type LucideIcon } from 'lucide-react';

import { HomeSectionsSkeleton } from '@/components/home/home-sections-skeleton';
import { ImageThumb } from '@/components/shared/image-thumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { formatPrice } from '@/lib/format';
import { accessoryService } from '@/services/accessory.service';
import { productService } from '@/services/product.service';

function CatalogLink({
  href,
  icon: Icon,
  label,
  count,
  isRtl,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  count: number;
  isRtl: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-sm transition-[border-color,box-shadow,background-color] duration-200 hover:border-foreground/15 hover:bg-accent/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight tabular-nums">
          {count}
        </p>
      </div>
      <ArrowRight
        aria-hidden
        className={`h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:text-foreground ${
          isRtl
            ? 'rotate-180 group-hover:-translate-x-0.5'
            : 'group-hover:translate-x-0.5'
        }`}
      />
    </Link>
  );
}

export function HomeSections() {
  const { t, locale } = useI18n();
  const labels = useLocalizedLabels();
  const isRtl = locale === 'ar';

  const data = useCachedLiveQuery('home-sections', async () => {
    const [products, accessories] = await Promise.all([
      productService.search({}),
      accessoryService.search({}),
    ]);
    return { products, accessories };
  }, []);

  const recentProducts = React.useMemo(
    () =>
      data
        ? data.products
            .filter((p) => p.availability === 'available')
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 4)
        : [],
    [data],
  );
  const recentAccessories = React.useMemo(
    () =>
      data
        ? data.accessories
            .filter((a) => a.availability && a.quantity > 0)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 4)
        : [],
    [data],
  );

  if (!data) {
    return <HomeSectionsSkeleton />;
  }

  const productCount = data.products.length;
  const accessoryCount = data.accessories.length;

  return (
    <div>
      <section className="container-narrow grid gap-3 pb-16 sm:grid-cols-2">
        <CatalogLink
          href="/products"
          icon={Laptop}
          label={t('home.usedDevices')}
          count={productCount}
          isRtl={isRtl}
        />
        <CatalogLink
          href="/accessories"
          icon={Plug}
          label={t('home.accessories')}
          count={accessoryCount}
          isRtl={isRtl}
        />
      </section>

      <section className="container-narrow pb-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t('home.latestDevices')}</h2>
            <p className="text-sm text-muted-foreground">{t('home.latestDevicesHint')}</p>
          </div>
          <Link
            href="/products"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            {t('home.viewAll')}
          </Link>
        </div>
        {recentProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="font-medium">{t('home.empty.noDevices')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('home.empty.noDevicesHint')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="group">
                <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
                  <div className="aspect-square bg-muted">
                    <ImageThumb imageId={product.coverImageId} alt={product.model} />
                  </div>
                  <CardContent className="p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {labels.productCategory(product.category)}
                    </div>
                    <div className="mt-1 line-clamp-1 font-medium">{product.model}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {labels.availability(product.availability)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container-narrow pb-24">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('home.accessoriesInStock')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('home.accessoriesInStockHint')}</p>
          </div>
          <Link
            href="/accessories"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            {t('home.viewAll')}
          </Link>
        </div>
        {recentAccessories.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="font-medium">{t('home.empty.noAccessories')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('home.empty.noAccessoriesHint')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentAccessories.map((accessory) => (
              <Link key={accessory.id} href={`/accessories/${accessory.id}`} className="group">
                <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
                  <div className="aspect-square bg-muted">
                    <ImageThumb imageId={accessory.coverImageId} alt={accessory.name} />
                  </div>
                  <CardContent className="p-4">
                    <div className="line-clamp-1 text-xs uppercase tracking-wider text-muted-foreground">
                      {accessory.name}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">{formatPrice(accessory.price)}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {accessory.quantity} {t('accessory.unitsAvailable')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
