'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ACCESSORY_CATEGORIES, type AccessoryCategory } from '@/lib/accessory-constants';
import { ACCESSORY_PRICE_FILTER_OPTIONS } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface AccessoryFilters {
  query: string;
  category: AccessoryCategory | 'all';
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sortBy: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name';
  page: number;
}

export const DEFAULT_ACCESSORY_FILTERS: AccessoryFilters = {
  query: '',
  category: 'all',
  minPrice: '',
  maxPrice: '',
  inStockOnly: false,
  sortBy: 'newest',
  page: 1,
};

function filtersFromParams(params: URLSearchParams): AccessoryFilters {
  return {
    query: params.get('q') ?? '',
    category: (params.get('category') || 'all') as AccessoryFilters['category'],
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    inStockOnly: params.get('inStock') === '1',
    sortBy: (params.get('sortBy') || 'newest') as AccessoryFilters['sortBy'],
    page: Number(params.get('page') || 1),
  };
}

function filtersToParams(filters: AccessoryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.inStockOnly) params.set('inStock', '1');
  if (filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function useAccessoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const filters = React.useMemo(
    () => filtersFromParams(new URLSearchParams(searchParams?.toString() ?? '')),
    [searchParams],
  );

  const applyUrl = React.useCallback(
    (next: AccessoryFilters) => {
      const params = filtersToParams(next);
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `?${query}` : '?', { scroll: false });
      });
    },
    [router],
  );

  const setFilters = React.useCallback(
    (
      updater:
        | Partial<AccessoryFilters>
        | ((prev: AccessoryFilters) => AccessoryFilters),
    ) => {
      const next =
        typeof updater === 'function' ? updater(filters) : { ...filters, ...updater };
      applyUrl(next);
    },
    [applyUrl, filters],
  );

  const reset = React.useCallback(() => {
    applyUrl({ ...DEFAULT_ACCESSORY_FILTERS });
  }, [applyUrl]);

  return { filters, setFilters, reset };
}

interface AccessoryFiltersBarProps {
  filters: AccessoryFilters;
  onChange: (
    updater: Partial<AccessoryFilters> | ((prev: AccessoryFilters) => AccessoryFilters),
  ) => void;
  onReset: () => void;
}

export function AccessoryFiltersBar({ filters, onChange, onReset }: AccessoryFiltersBarProps) {
  const { t, locale } = useI18n();
  const labels = useLocalizedLabels();
  const active = countActiveFilters(filters);
  const priceLocale = locale === 'ar' ? 'ar-EG' : 'en-EG';

  const priceOptions = React.useMemo(() => {
    const values = new Set<number>(ACCESSORY_PRICE_FILTER_OPTIONS);
    for (const raw of [filters.minPrice, filters.maxPrice]) {
      const n = Number(raw);
      if (raw && Number.isFinite(n) && n > 0) values.add(n);
    }
    return Array.from(values).sort((a, b) => a - b);
  }, [filters.minPrice, filters.maxPrice]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value, page: 1 })}
            placeholder={t('accessories.searchPlaceholder')}
            className="h-10 border-border/80 pl-9 shadow-none rtl:pl-3 rtl:pr-9"
            aria-label={t('common.search')}
          />
        </div>
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            onChange({ sortBy: value as AccessoryFilters['sortBy'], page: 1 })
          }
        >
          <SelectTrigger
            className="h-10 shrink-0 border-border/80 shadow-none sm:w-44"
            aria-label={t('accessories.sortBy')}
          >
            <SelectValue placeholder={t('accessories.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('accessories.sort.newest')}</SelectItem>
            <SelectItem value="oldest">{t('accessories.sort.oldest')}</SelectItem>
            <SelectItem value="price-asc">{t('accessories.sort.priceAsc')}</SelectItem>
            <SelectItem value="price-desc">{t('accessories.sort.priceDesc')}</SelectItem>
            <SelectItem value="name">{t('accessories.sort.name')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
          <Select
            value={filters.category}
            onValueChange={(value) =>
              onChange({ category: value as AccessoryFilters['category'], page: 1 })
            }
          >
            <SelectTrigger
              className={cn(
                'h-10 border-border/80 shadow-none',
                filters.category !== 'all' && 'border-foreground/25 bg-muted/50 font-medium',
              )}
              aria-label={t('accessories.filters.category')}
            >
              <SelectValue placeholder={t('accessories.filters.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('accessories.filters.allCategories')}</SelectItem>
              {ACCESSORY_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {labels.accessoryCategory(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.minPrice || 'all'}
            onValueChange={(value) =>
              onChange({ minPrice: value === 'all' ? '' : value, page: 1 })
            }
          >
            <SelectTrigger
              className={cn(
                'h-10 border-border/80 shadow-none',
                filters.minPrice && 'border-foreground/25 bg-muted/50 font-medium',
              )}
              aria-label={t('accessories.filters.minPrice')}
            >
              <SelectValue placeholder={t('accessories.filters.minPrice')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('accessories.filters.anyMinPrice')}</SelectItem>
              {priceOptions.map((price) => (
                <SelectItem key={`min-${price}`} value={String(price)}>
                  {formatPrice(price, 'EGP', priceLocale)}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.maxPrice || 'all'}
            onValueChange={(value) =>
              onChange({ maxPrice: value === 'all' ? '' : value, page: 1 })
            }
          >
            <SelectTrigger
              className={cn(
                'h-10 border-border/80 shadow-none',
                filters.maxPrice && 'border-foreground/25 bg-muted/50 font-medium',
              )}
              aria-label={t('accessories.filters.maxPrice')}
            >
              <SelectValue placeholder={t('accessories.filters.maxPrice')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('accessories.filters.anyMaxPrice')}</SelectItem>
              {priceOptions.map((price) => (
                <SelectItem key={`max-${price}`} value={String(price)}>
                  {formatPrice(price, 'EGP', priceLocale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <label
            className={cn(
              'flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border/80 bg-background px-3 text-sm shadow-none',
              filters.inStockOnly && 'border-foreground/25 bg-muted/50 font-medium',
            )}
          >
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(event) => onChange({ inStockOnly: event.target.checked, page: 1 })}
              className="h-4 w-4 accent-foreground"
            />
            {t('accessories.filters.inStockOnly')}
          </label>

          {active > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-10 gap-1.5 px-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              {t('common.reset')}
              <span className="text-xs tabular-nums text-muted-foreground">
                ({t('accessories.activeFilters', active)})
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function countActiveFilters(filters: AccessoryFilters): number {
  let count = 0;
  if (filters.query) count += 1;
  if (filters.category !== 'all') count += 1;
  if (filters.minPrice) count += 1;
  if (filters.maxPrice) count += 1;
  if (filters.inStockOnly) count += 1;
  return count;
}
