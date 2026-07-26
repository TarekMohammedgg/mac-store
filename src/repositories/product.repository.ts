'use client';

import {
  AVAILABILITY_OPTIONS,
  PRODUCT_CATEGORIES,
  type Availability,
  type ProductCategory,
} from '@/lib/constants';
import { getDb } from '@/lib/db';
import { generateId, toIsoString } from '@/lib/utils';
import type { Product, ProductCreate, ProductUpdate } from '@/models/product';

import type {
  PaginatedResult,
  ProductListParams,
  ProductRepository,
  ProductSearchParams,
} from './product-repository.types';

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
  if (params.cpu && product.cpu.toLowerCase() !== params.cpu.toLowerCase()) return false;
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

class DexieProductRepository implements ProductRepository {
  async list(params: ProductListParams = {}): Promise<PaginatedResult<Product>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, ...search } = params;
    const db = getDb();
    const all = await db.products.toArray();
    const filtered = all.filter((item) => matchesSearch(item, search));
    const sorted = sortItems(filtered, search.sortBy);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async search(params: ProductSearchParams): Promise<Product[]> {
    const db = getDb();
    const all = await db.products.toArray();
    return sortItems(all.filter((item) => matchesSearch(item, params)), params.sortBy);
  }

  async findById(id: string): Promise<Product | null> {
    const db = getDb();
    const record = await db.products.get(id);
    return record ?? null;
  }

  async create(data: ProductCreate): Promise<Product> {
    const db = getDb();
    const now = toIsoString(new Date());
    const record: Product = {
      ...data,
      id: generateId('prd'),
      createdAt: now,
      updatedAt: now,
    };
    await db.products.put(record);
    return record;
  }

  async update(id: string, data: ProductUpdate): Promise<Product> {
    const db = getDb();
    const existing = await db.products.get(id);
    if (!existing) throw new Error(`Product ${id} not found`);
    const next: Product = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: toIsoString(new Date()),
    };
    await db.products.put(next);
    return next;
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    const product = await db.products.get(id);
    if (!product) return;
    await db.transaction('rw', db.products, db.images, async () => {
      await db.products.delete(id);
      const ids = [product.coverImageId, ...product.imageIds].filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
      );
      if (ids.length > 0) {
        await db.images.bulkDelete(ids);
      }
    });
  }

  async duplicate(id: string): Promise<Product> {
    const source = await this.findById(id);
    if (!source) throw new Error(`Product ${id} not found`);
    const now = toIsoString(new Date());
    const clone: Product = {
      ...source,
      id: generateId('prd'),
      serialNumber: `${source.serialNumber}-COPY`,
      inventoryDate: now,
      availability: 'unavailable',
      createdAt: now,
      updatedAt: now,
    };
    const db = getDb();
    await db.products.put(clone);
    return clone;
  }

  async countByAvailability(): Promise<Record<Availability, number>> {
    const db = getDb();
    const all = await db.products.toArray();
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
    const db = getDb();
    const all = await db.products.toArray();
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

export const productRepository: ProductRepository = new DexieProductRepository();
