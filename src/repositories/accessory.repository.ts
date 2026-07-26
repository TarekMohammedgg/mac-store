'use client';

import { ACCESSORY_CATEGORIES, type AccessoryCategory } from '@/lib/accessory-constants';
import { getDb } from '@/lib/db';
import { generateId, toIsoString } from '@/lib/utils';
import type { Accessory, AccessoryCreate, AccessoryUpdate } from '@/models/accessory';

import type {
  AccessoryListParams,
  AccessoryRepository,
  AccessorySearchParams,
  PaginatedResult,
} from './accessory-repository.types';

const DEFAULT_PAGE_SIZE = 12;

function matchesQuery(accessory: Accessory, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    accessory.name.toLowerCase().includes(needle) ||
    accessory.category.toLowerCase().includes(needle) ||
    accessory.description.toLowerCase().includes(needle)
  );
}

function matchesSearch(accessory: Accessory, params: AccessorySearchParams): boolean {
  if (params.query && !matchesQuery(accessory, params.query)) return false;
  if (params.category && params.category !== 'all' && accessory.category !== params.category)
    return false;
  if (typeof params.minPrice === 'number' && accessory.price < params.minPrice) return false;
  if (typeof params.maxPrice === 'number' && accessory.price > params.maxPrice) return false;
  if (params.onlyAvailable && (!accessory.availability || accessory.quantity <= 0)) return false;
  return true;
}

function sortItems(items: Accessory[], sortBy: AccessorySearchParams['sortBy']): Accessory[] {
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

class DexieAccessoryRepository implements AccessoryRepository {
  async list(params: AccessoryListParams = {}): Promise<PaginatedResult<Accessory>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, ...search } = params;
    const db = getDb();
    const all = await db.accessories.toArray();
    const filtered = all.filter((item) => matchesSearch(item, search));
    const sorted = sortItems(filtered, search.sortBy);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async search(params: AccessorySearchParams): Promise<Accessory[]> {
    const db = getDb();
    const all = await db.accessories.toArray();
    return sortItems(all.filter((item) => matchesSearch(item, params)), params.sortBy);
  }

  async findById(id: string): Promise<Accessory | null> {
    const db = getDb();
    const record = await db.accessories.get(id);
    return record ?? null;
  }

  async create(data: AccessoryCreate): Promise<Accessory> {
    const db = getDb();
    const now = toIsoString(new Date());
    const record: Accessory = {
      ...data,
      id: generateId('acc'),
      createdAt: now,
      updatedAt: now,
    };
    await db.accessories.put(record);
    return record;
  }

  async update(id: string, data: AccessoryUpdate): Promise<Accessory> {
    const db = getDb();
    const existing = await db.accessories.get(id);
    if (!existing) throw new Error(`Accessory ${id} not found`);
    const next: Accessory = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: toIsoString(new Date()),
    };
    await db.accessories.put(next);
    return next;
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    const accessory = await db.accessories.get(id);
    if (!accessory) return;
    await db.transaction('rw', db.accessories, db.images, async () => {
      await db.accessories.delete(id);
      const ids = [accessory.coverImageId, ...accessory.imageIds].filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
      );
      if (ids.length > 0) {
        await db.images.bulkDelete(ids);
      }
    });
  }

  async duplicate(id: string): Promise<Accessory> {
    const source = await this.findById(id);
    if (!source) throw new Error(`Accessory ${id} not found`);
    const now = toIsoString(new Date());
    const clone: Accessory = {
      ...source,
      id: generateId('acc'),
      name: `${source.name} (Copy)`,
      quantity: 0,
      availability: false,
      createdAt: now,
      updatedAt: now,
    };
    const db = getDb();
    await db.accessories.put(clone);
    return clone;
  }

  async adjustQuantity(id: string, delta: number): Promise<Accessory> {
    const db = getDb();
    const existing = await db.accessories.get(id);
    if (!existing) throw new Error(`Accessory ${id} not found`);
    const quantity = Math.max(0, existing.quantity + delta);
    const availability = quantity > 0;
    return this.update(id, { quantity, availability });
  }

  async countByCategory(): Promise<Record<AccessoryCategory, number>> {
    const db = getDb();
    const all = await db.accessories.toArray();
    const counts = ACCESSORY_CATEGORIES.reduce(
      (acc, key) => ({ ...acc, [key]: 0 }),
      {} as Record<AccessoryCategory, number>,
    );
    for (const accessory of all) {
      counts[accessory.category] += 1;
    }
    return counts;
  }
}

export const accessoryRepository: AccessoryRepository = new DexieAccessoryRepository();
