'use client';

import * as React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { ArrowRight, Laptop, Plug } from 'lucide-react';

import { HomeSectionsSkeleton } from '@/components/home/home-sections-skeleton';
import { ImageThumb } from '@/components/shared/image-thumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { getDb } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export function HomeSections() {
  const { t, locale } = useI18n();
  const labels = useLocalizedLabels();
  const isRtl = locale === 'ar';

  const data = useLiveQuery(async () => {
    const db = getDb();
    const [products, accessories] = await Promise.all([
      db.products.toArray(),
      db.accessories.toArray(),
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
      <section className="container-narrow grid gap-4 pb-16 sm:grid-cols-2">
        <Link
          href="/products"
          className="group flex items-center justify-between rounded-lg border p-6 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('home.usedDevices')}</div>
              <div className="text-2xl font-semibold">{productCount}</div>
            </div>
          </div>
          <ArrowRight
            className={`h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`}
          />
        </Link>
        <Link
          href="/accessories"
          className="group flex items-center justify-between rounded-lg border p-6 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
              <Plug className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('home.accessories')}</div>
              <div className="text-2xl font-semibold">{accessoryCount}</div>
            </div>
          </div>
          <ArrowRight
            className={`h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`}
          />
        </Link>
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
