'use client';

import {
  AVAILABILITY_OPTIONS,
  PRODUCT_CATEGORIES,
  matchesCpuFilter,
  type Availability,
  type ProductCategory,
} from '@/lib/constants';
import { notifyDataRefresh } from '@/lib/data-refresh';
import { mapProduct, toProductRow, type ProductRow } from '@/lib/supabase/mappers';
import { supabase } from '@/lib/supabase/client';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { generateId, toIsoString } from '@/lib/utils';
import type { Product, ProductCreate, ProductUpdate } from '@/models/product';

import type {
  PaginatedResult,
  ProductListParams,
  ProductRepository,
  ProductSearchParams,
} from './product-repository.types';
import { imageRepository } from './image.repository';

const DEFAULT_PAGE_SIZE = 12;

function matchesQuery(product: Product, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    product.model.toLowerCase().includes(needle) ||
    product.cpu.toLowerCase().includes(needle) ||
    String(product.ram).includes(needle) ||
    String(product.storage).includes(needle) ||
    product.storageType.toLowerCase().includes(needle) ||
    product.serialNumber.toLowerCase().includes(needle) ||
    product.category.toLowerCase().includes(needle) ||
    product.condition.toLowerCase().includes(needle) ||
    product.description.toLowerCase().includes(needle)
  );
}

function matchesSearch(product: Product, params: ProductSearchParams): boolean {
  if (params.query && !matchesQuery(product, params.query)) return false;
  if (params.category && params.category !== 'all' && product.category !== params.category)
    return false;
  if (params.condition && params.condition !== 'all' && product.condition !== params.condition)
    return false;
  if (params.availability && params.availability !== 'all' && product.availability !== params.availability)
    return false;
  if (params.cpu && !matchesCpuFilter(product.cpu, params.cpu)) return false;
  if (typeof params.minPrice === 'number' && product.price < params.minPrice) return false;
  if (typeof params.maxPrice === 'number' && product.price > params.maxPrice) return false;
  if (typeof params.minRam === 'number' && product.ram < params.minRam) return false;
  if (typeof params.maxRam === 'number' && product.ram > params.maxRam) return false;
  if (typeof params.minStorage === 'number' && product.storage < params.minStorage) return false;
  if (typeof params.maxStorage === 'number' && product.storage > params.maxStorage) return false;
  if (params.onlyAvailable && product.availability !== 'available') return false;
  return true;
}

function sortItems(items: Product[], sortBy: ProductSearchParams['sortBy']): Product[] {
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

async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*');
  throwIfSupabaseError(error);
  return ((data ?? []) as ProductRow[]).map(mapProduct);
}

class SupabaseProductRepository implements ProductRepository {
  async list(params: ProductListParams = {}): Promise<PaginatedResult<Product>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, ...search } = params;
    const all = await fetchAllProducts();
    const filtered = all.filter((item) => matchesSearch(item, search));
    const sorted = sortItems(filtered, search.sortBy);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async search(params: ProductSearchParams): Promise<Product[]> {
    const all = await fetchAllProducts();
    return sortItems(all.filter((item) => matchesSearch(item, params)), params.sortBy);
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    throwIfSupabaseError(error);
    return data ? mapProduct(data as ProductRow) : null;
  }

  async create(data: ProductCreate): Promise<Product> {
    const now = toIsoString(new Date());
    const record: Product = {
      ...data,
      id: generateId('prd'),
      createdAt: now,
      updatedAt: now,
    };
    const { data: inserted, error } = await supabase
      .from('products')
      .insert(toProductRow(record))
      .select('*')
      .single();
    throwIfSupabaseError(error);
    notifyDataRefresh();
    return mapProduct(inserted as ProductRow);
  }

  async update(id: string, data: ProductUpdate): Promise<Product> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Product ${id} not found`);
    const next: Product = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: toIsoString(new Date()),
    };
    const { data: updated, error } = await supabase
      .from('products')
      .update(toProductRow(next))
      .eq('id', id)
      .select('*')
      .single();
    throwIfSupabaseError(error);
    notifyDataRefresh();
    return mapProduct(updated as ProductRow);
  }

  async delete(id: string): Promise<void> {
    const product = await this.findById(id);
    if (!product) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    throwIfSupabaseError(error);
    const ids = [product.coverImageId, ...product.imageIds].filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
    if (ids.length > 0) {
      await imageRepository.deleteMany(ids);
    }
    notifyDataRefresh();
  }

  async duplicate(id: string): Promise<Product> {
    const source = await this.findById(id);
    if (!source) throw new Error(`Product ${id} not found`);
    const now = toIsoString(new Date());
    return this.create({
      ...source,
      serialNumber: `${source.serialNumber}-COPY`,
      inventoryDate: now,
      availability: 'unavailable',
    });
  }

  async countByAvailability(): Promise<Record<Availability, number>> {
    const all = await fetchAllProducts();
    const counts = AVAILABILITY_OPTIONS.reduce(
      (acc, key) => ({ ...acc, [key]: 0 }),
      {} as Record<Availability, number>,
    );
    for (const product of all) {
      counts[product.availability] += 1;
    }
    return counts;
  }

  async countByCategory(): Promise<Record<ProductCategory, number>> {
    const all = await fetchAllProducts();
    const counts = PRODUCT_CATEGORIES.reduce(
      (acc, key) => ({ ...acc, [key]: 0 }),
      {} as Record<ProductCategory, number>,
    );
    for (const product of all) {
      counts[product.category] += 1;
    }
    return counts;
  }
}

export const productRepository: ProductRepository = new SupabaseProductRepository();
