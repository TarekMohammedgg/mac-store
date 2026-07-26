import { describe, expect, it } from 'vitest';

import {
  DEFAULT_FILTERS,
  type ProductFilters,
} from '@/features/products/product-filters';

function makeSearchParams(filters: Partial<ProductFilters>): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.condition && filters.condition !== 'all') params.set('condition', filters.condition);
  if (filters.availability && filters.availability !== 'all')
    params.set('availability', filters.availability);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.minRam) params.set('minRam', filters.minRam);
  if (filters.minStorage) params.set('minStorage', filters.minStorage);
  if (filters.cpu) params.set('cpu', filters.cpu);
  if (filters.sortBy && filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  return params;
}

function roundTrip(filters: Partial<ProductFilters>): Partial<ProductFilters> {
  const params = makeSearchParams(filters);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out as Partial<ProductFilters>;
}

describe('product filter URL shape', () => {
  it('omits default values from the URL', () => {
    const params = makeSearchParams({ ...DEFAULT_FILTERS });
    expect(params.toString()).toBe('');
  });

  it('preserves the query string across a round-trip', () => {
    const original: Partial<ProductFilters> = {
      query: 'macbook',
      category: 'macbook-pro',
      condition: 'excellent',
      availability: 'available',
      minPrice: '1000',
      maxPrice: '3000',
      minRam: '16',
      minStorage: '512',
      cpu: 'M2',
      sortBy: 'price-asc',
      page: 3,
    };
    const round = roundTrip(original);
    expect(round).toEqual({
      q: 'macbook',
      category: 'macbook-pro',
      condition: 'excellent',
      availability: 'available',
      minPrice: '1000',
      maxPrice: '3000',
      minRam: '16',
      minStorage: '512',
      cpu: 'M2',
      sortBy: 'price-asc',
      page: '3',
    });
  });

  it('does not include page=1 in the URL', () => {
    const params = makeSearchParams({ page: 1 });
    expect(params.toString()).toBe('');
  });
});
