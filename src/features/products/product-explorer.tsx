'use client';

import * as React from 'react';

import { useI18n } from '@/i18n';
import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { ProductCard } from '@/components/products/product-card';
import { ProductGridSkeleton } from '@/components/shared/skeletons';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { productService } from '@/services/product.service';
import { safeNumber } from '@/lib/utils';
import { matchesCpuFilter } from '@/lib/constants';
import type { Product } from '@/models/product';

import { ProductFiltersBar, useProductFilters } from './product-filters';

const PAGE_SIZE = 12;

function matches(product: Product, filters: ReturnType<typeof useProductFilters>['filters']): boolean {
  const query = filters.query.trim().toLowerCase();
  if (query) {
    const haystack = [
      product.model,
      product.cpu,
      product.serialNumber,
      product.category,
      product.condition,
      product.description,
      String(product.ram),
      String(product.storage),
      product.storageType,
      product.year !== null ? String(product.year) : '',
      product.screenSize ?? '',
      product.gpu ?? '',
      product.warranty ?? '',
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (filters.category !== 'all' && product.category !== filters.category) return false;
  if (filters.condition !== 'all' && product.condition !== filters.condition) return false;
  if (filters.availability !== 'all' && product.availability !== filters.availability) return false;
  if (filters.cpu && !matchesCpuFilter(product.cpu, filters.cpu)) return false;
  const minPrice = safeNumber(filters.minPrice, NaN);
  const maxPrice = safeNumber(filters.maxPrice, NaN);
  if (!Number.isNaN(minPrice) && product.price < minPrice) return false;
  if (!Number.isNaN(maxPrice) && product.price > maxPrice) return false;
  const minRam = safeNumber(filters.minRam, NaN);
  if (!Number.isNaN(minRam) && product.ram < minRam) return false;
  const minStorage = safeNumber(filters.minStorage, NaN);
  if (!Number.isNaN(minStorage) && product.storage < minStorage) return false;
  return true;
}

function sort(items: Product[], sortBy: string): Product[] {
  const sorted = [...items];
  switch (sortBy) {
    case 'oldest':
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'model':
      sorted.sort((a, b) => a.model.localeCompare(b.model));
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return sorted;
}

export function ProductExplorer() {
  const { t } = useI18n();
  const { filters, setFilters, reset } = useProductFilters();
  const deferredQuery = React.useDeferredValue(filters.query);
  const products = useCachedLiveQuery(
    'public-products',
    async () => {
      const result = await productService.search({ onlyAvailable: false });
      return result.filter((p) => p.availability !== 'sold');
    },
    [],
  );

  const effectiveFilters = React.useMemo(
    () => ({ ...filters, query: deferredQuery }),
    [filters, deferredQuery],
  );

  const result = React.useMemo(() => {
    if (!products) return null;
    const filtered = products.filter((p) => matches(p, effectiveFilters));
    const sorted = sort(filtered, effectiveFilters.sortBy);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const page = Math.min(effectiveFilters.page, totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return {
      items: sorted.slice(start, start + PAGE_SIZE),
      total: sorted.length,
      page,
      totalPages,
    };
  }, [products, effectiveFilters]);

  if (products === undefined) {
    return <ProductGridSkeleton count={8} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('products.title')}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('products.pageDescription')}
        </p>
      </div>
      <ProductFiltersBar filters={filters} onChange={setFilters} onReset={reset} />

      {result && result.total === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="font-medium">{t('products.empty.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('products.empty.description')}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 text-sm text-foreground underline-offset-4 hover:underline"
          >
            {t('common.resetFilters')}
          </button>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            {t('products.count', result?.total ?? 0)}
          </div>
          <div className="catalog-grid">
            {result?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {result && result.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setFilters({ page: Math.max(1, result.page - 1) })}
                    disabled={result.page <= 1}
                  />
                </PaginationItem>
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === result.page}
                      onClick={() => setFilters({ page })}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setFilters({ page: Math.min(result.totalPages, result.page + 1) })}
                    disabled={result.page >= result.totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
