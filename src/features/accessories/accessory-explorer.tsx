'use client';

import * as React from 'react';
import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';

import { useI18n } from '@/i18n';
import { AccessoryCard } from '@/components/accessories/accessory-card';
import { AccessoryGridSkeleton } from '@/components/shared/skeletons';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { accessoryService } from '@/services/accessory.service';
import { safeNumber } from '@/lib/utils';
import type { Accessory } from '@/models/accessory';

import { AccessoryFiltersBar, useAccessoryFilters } from './accessory-filters';

const PAGE_SIZE = 12;

function matches(
  accessory: Accessory,
  filters: ReturnType<typeof useAccessoryFilters>['filters'],
): boolean {
  const query = filters.query.trim().toLowerCase();
  if (query) {
    const haystack = `${accessory.name} ${accessory.category} ${accessory.description}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (filters.category !== 'all' && accessory.category !== filters.category) return false;
  const minPrice = safeNumber(filters.minPrice, NaN);
  const maxPrice = safeNumber(filters.maxPrice, NaN);
  if (!Number.isNaN(minPrice) && accessory.price < minPrice) return false;
  if (!Number.isNaN(maxPrice) && accessory.price > maxPrice) return false;
  if (filters.inStockOnly && (accessory.quantity <= 0 || !accessory.availability)) return false;
  return true;
}

function sort(items: Accessory[], sortBy: string): Accessory[] {
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
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return sorted;
}

export function AccessoryExplorer() {
  const { t } = useI18n();
  const { filters, setFilters, reset } = useAccessoryFilters();
  const deferredQuery = React.useDeferredValue(filters.query);
  const accessories = useCachedLiveQuery(
    'public-accessories',
    async () => accessoryService.search({}),
    [],
  );

  const effectiveFilters = React.useMemo(
    () => ({ ...filters, query: deferredQuery }),
    [filters, deferredQuery],
  );

  const result = React.useMemo(() => {
    if (!accessories) return null;
    const filtered = accessories.filter((a) => matches(a, effectiveFilters));
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
  }, [accessories, effectiveFilters]);

  if (accessories === undefined) {
    return <AccessoryGridSkeleton count={8} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('accessories.pageTitle')}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('accessories.pageDescription')}
        </p>
      </div>
      <AccessoryFiltersBar filters={filters} onChange={setFilters} onReset={reset} />
      {result && result.total === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="font-medium">{t('accessories.empty.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('accessories.empty.description')}</p>
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
            {t('accessories.count', result?.total ?? 0)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result?.items.map((accessory) => (
              <AccessoryCard key={accessory.id} accessory={accessory} />
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
