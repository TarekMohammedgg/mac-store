'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice } from '@/lib/format';
import {
  AVAILABILITY_OPTIONS,
  CONDITIONS,
  PRODUCT_CATEGORIES,
  PRODUCT_CPU_FILTER_OPTIONS,
  PRODUCT_PRICE_FILTER_OPTIONS,
  PRODUCT_RAM_FILTER_OPTIONS,
  PRODUCT_STORAGE_FILTER_OPTIONS,
  formatRamFilterLabel,
  formatStorageFilterLabel,
  type Availability,
  type Condition,
  type ProductCategory,
} from '@/lib/constants';

export interface ProductFilters {
  query: string;
  category: ProductCategory | 'all';
  condition: Condition | 'all';
  availability: Availability | 'all';
  minPrice: string;
  maxPrice: string;
  minRam: string;
  minStorage: string;
  cpu: string;
  sortBy: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'model';
  page: number;
}

export const DEFAULT_FILTERS: ProductFilters = {
  query: '',
  category: 'all',
  condition: 'all',
  availability: 'all',
  minPrice: '',
  maxPrice: '',
  minRam: '',
  minStorage: '',
  cpu: '',
  sortBy: 'newest',
  page: 1,
};

function filtersFromSearchParams(params: URLSearchParams): ProductFilters {
  const get = (key: string) => params.get(key) ?? '';
  return {
    query: get('q'),
    category: (get('category') || 'all') as ProductFilters['category'],
    condition: (get('condition') || 'all') as ProductFilters['condition'],
    availability: (get('availability') || 'all') as ProductFilters['availability'],
    minPrice: get('minPrice'),
    maxPrice: get('maxPrice'),
    minRam: get('minRam'),
    minStorage: get('minStorage'),
    cpu: get('cpu'),
    sortBy: (get('sortBy') || 'newest') as ProductFilters['sortBy'],
    page: Number(get('page') || 1),
  };
}

function filtersToSearchParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.condition !== 'all') params.set('condition', filters.condition);
  if (filters.availability !== 'all') params.set('availability', filters.availability);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.minRam) params.set('minRam', filters.minRam);
  if (filters.minStorage) params.set('minStorage', filters.minStorage);
  if (filters.cpu) params.set('cpu', filters.cpu);
  if (filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function useProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const filters = React.useMemo(
    () => filtersFromSearchParams(new URLSearchParams(searchParams?.toString() ?? '')),
    [searchParams],
  );

  const applyUrl = React.useCallback(
    (next: ProductFilters) => {
      const params = filtersToSearchParams(next);
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `?${query}` : '?', { scroll: false });
      });
    },
    [router],
  );

  const setFilters = React.useCallback(
    (updater: Partial<ProductFilters> | ((prev: ProductFilters) => ProductFilters)) => {
      const next =
        typeof updater === 'function' ? updater(filters) : { ...filters, ...updater };
      applyUrl(next);
    },
    [applyUrl, filters],
  );

  const reset = React.useCallback(() => {
    applyUrl({ ...DEFAULT_FILTERS });
  }, [applyUrl]);

  return { filters, setFilters, reset };
}

interface ProductFiltersBarProps {
  filters: ProductFilters;
  onChange: (updater: Partial<ProductFilters> | ((prev: ProductFilters) => ProductFilters)) => void;
  onReset: () => void;
}

export function ProductFiltersBar({ filters, onChange, onReset }: ProductFiltersBarProps) {
  const { t, locale } = useI18n();
  const labels = useLocalizedLabels();
  const activeCount = countActiveFilters(filters);
  const priceLocale = locale === 'ar' ? 'ar-EG' : 'en-EG';

  const priceOptions = React.useMemo(() => {
    const values = new Set<number>(PRODUCT_PRICE_FILTER_OPTIONS);
    for (const raw of [filters.minPrice, filters.maxPrice]) {
      const n = Number(raw);
      if (raw && Number.isFinite(n) && n > 0) values.add(n);
    }
    return Array.from(values).sort((a, b) => a - b);
  }, [filters.minPrice, filters.maxPrice]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value, page: 1 })}
            placeholder={t('products.searchPlaceholder')}
            className="pl-9 rtl:pl-3 rtl:pr-9"
            aria-label={t('common.search')}
          />
        </div>
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            onChange({ sortBy: value as ProductFilters['sortBy'], page: 1 })
          }
        >
          <SelectTrigger className="sm:w-48" aria-label={t('products.sortBy')}>
            <SelectValue placeholder={t('products.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('products.sort.newest')}</SelectItem>
            <SelectItem value="oldest">{t('products.sort.oldest')}</SelectItem>
            <SelectItem value="price-asc">{t('products.sort.priceAsc')}</SelectItem>
            <SelectItem value="price-desc">{t('products.sort.priceDesc')}</SelectItem>
            <SelectItem value="model">{t('products.sort.model')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={filters.category}
          onValueChange={(value) =>
            onChange({ category: value as ProductFilters['category'], page: 1 })
          }
        >
          <SelectTrigger aria-label={t('products.filters.category')}>
            <SelectValue placeholder={t('products.filters.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.filters.allCategories')}</SelectItem>
            {PRODUCT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {labels.productCategory(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.condition}
          onValueChange={(value) =>
            onChange({ condition: value as ProductFilters['condition'], page: 1 })
          }
        >
          <SelectTrigger aria-label={t('products.filters.condition')}>
            <SelectValue placeholder={t('products.filters.condition')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.filters.anyCondition')}</SelectItem>
            {CONDITIONS.map((cond) => (
              <SelectItem key={cond} value={cond}>
                {labels.condition(cond)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.availability}
          onValueChange={(value) =>
            onChange({ availability: value as ProductFilters['availability'], page: 1 })
          }
        >
          <SelectTrigger aria-label={t('products.filters.availability')}>
            <SelectValue placeholder={t('products.filters.availability')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.filters.anyAvailability')}</SelectItem>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {labels.availability(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.cpu || 'all'}
          onValueChange={(value) =>
            onChange({ cpu: value === 'all' ? '' : value, page: 1 })
          }
        >
          <SelectTrigger aria-label={t('products.filters.cpu')}>
            <SelectValue placeholder={t('products.filters.cpu')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.filters.anyCpu')}</SelectItem>
            {PRODUCT_CPU_FILTER_OPTIONS.map((cpu) => (
              <SelectItem key={cpu} value={cpu}>
                {cpu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={filters.minPrice || 'all'}
          onValueChange={(value) =>
            onChange({ minPrice: value === 'all' ? '' : value, page: 1 })
          }
        >
          <SelectTrigger aria-label={t('products.filters.minPrice')}>
            <SelectValue placeholder={t('products.filters.minPrice')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.filters.anyMinPrice')}</SelectItem>
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
          <SelectTrigger aria-label={t('products.filters.maxPrice')}>
            <SelectValue placeholder={t('products.filters.maxPrice')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.filters.anyMaxPrice')}</SelectItem>
            {priceOptions.map((price) => (
              <SelectItem key={`max-${price}`} value={String(price)}>
                {formatPrice(price, 'EGP', priceLocale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.minRam || 'all'}
          onValueChange={(value) =>
            onChange({ minRam: value === 'all' ? '' : value, page: 1 })
          }
        >
          <SelectTrigger aria-label={t('products.filters.minRam')}>
            <SelectValue placeholder={t('products.filters.minRam')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.filters.anyRam')}</SelectItem>
            {PRODUCT_RAM_FILTER_OPTIONS.map((ram) => (
              <SelectItem key={ram} value={String(ram)}>
                {formatRamFilterLabel(ram)}+
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.minStorage || 'all'}
          onValueChange={(value) =>
            onChange({ minStorage: value === 'all' ? '' : value, page: 1 })
          }
        >
          <SelectTrigger aria-label={t('products.filters.minStorage')}>
            <SelectValue placeholder={t('products.filters.minStorage')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.filters.anyStorage')}</SelectItem>
            {PRODUCT_STORAGE_FILTER_OPTIONS.map((storage) => (
              <SelectItem key={storage} value={String(storage)}>
                {formatStorageFilterLabel(storage)}+
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{t('products.activeFilters', activeCount)}</Badge>
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 px-2">
            <X className="mr-1 h-3.5 w-3.5" /> {t('common.reset')}
          </Button>
        </div>
      )}
    </div>
  );
}

function countActiveFilters(filters: ProductFilters): number {
  let count = 0;
  if (filters.query) count += 1;
  if (filters.category !== 'all') count += 1;
  if (filters.condition !== 'all') count += 1;
  if (filters.availability !== 'all') count += 1;
  if (filters.minPrice) count += 1;
  if (filters.maxPrice) count += 1;
  if (filters.minRam) count += 1;
  if (filters.minStorage) count += 1;
  if (filters.cpu) count += 1;
  return count;
}
