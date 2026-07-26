'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Laptop, Plug, type LucideIcon } from 'lucide-react';

import { HomeSectionsSkeleton } from '@/components/home/home-sections-skeleton';
import { AccessoryCard } from '@/components/accessories/accessory-card';
import { ProductCard } from '@/components/products/product-card';
import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { useI18n } from '@/i18n';
import { accessoryService } from '@/services/accessory.service';
import { productService } from '@/services/product.service';

/** Max product/accessory cards shown on the home landing page. */
const HOME_CARD_LIMIT = 4;

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
      className="group flex items-center gap-4 rounded-xl border border-border/80 bg-card p-5 transition-[border-color,background-color] duration-200 hover:border-foreground/15 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            .slice(0, HOME_CARD_LIMIT)
        : [],
    [data],
  );
  const recentAccessories = React.useMemo(
    () =>
      data
        ? data.accessories
            .filter((a) => a.availability && a.quantity > 0)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, HOME_CARD_LIMIT)
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

      <section className="container-narrow pb-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('home.latestDevices')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('home.latestDevicesHint')}</p>
          </div>
          <Link
            href="/products"
            className="hidden text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:inline-flex"
          >
            {t('home.viewAll')}
          </Link>
        </div>
        {recentProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="font-medium">{t('home.empty.noDevices')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('home.empty.noDevicesHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:gap-6 lg:grid-cols-4 lg:gap-6">
            {recentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container-narrow pb-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('home.accessoriesInStock')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('home.accessoriesInStockHint')}</p>
          </div>
          <Link
            href="/accessories"
            className="hidden text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:inline-flex"
          >
            {t('home.viewAll')}
          </Link>
        </div>
        {recentAccessories.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="font-medium">{t('home.empty.noAccessories')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('home.empty.noAccessoriesHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:gap-6 lg:grid-cols-4 lg:gap-6">
            {recentAccessories.map((accessory) => (
              <AccessoryCard key={accessory.id} accessory={accessory} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
