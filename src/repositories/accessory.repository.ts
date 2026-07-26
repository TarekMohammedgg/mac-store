'use client';

import { ACCESSORY_CATEGORIES, type AccessoryCategory } from '@/lib/accessory-constants';
import { notifyDataRefresh } from '@/lib/data-refresh';
import { mapAccessory, toAccessoryRow, type AccessoryRow } from '@/lib/supabase/mappers';
import { supabase } from '@/lib/supabase/client';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { generateId, toIsoString } from '@/lib/utils';
import type { Accessory, AccessoryCreate, AccessoryUpdate } from '@/models/accessory';

import type {
  AccessoryListParams,
  AccessoryRepository,
  AccessorySearchParams,
  PaginatedResult,
} from './accessory-repository.types';
import { imageRepository } from './image.repository';

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

async function fetchAllAccessories(): Promise<Accessory[]> {
  const { data, error } = await supabase.from('accessories').select('*');
  throwIfSupabaseError(error);
  return ((data ?? []) as AccessoryRow[]).map(mapAccessory);
}

class SupabaseAccessoryRepository implements AccessoryRepository {
  async list(params: AccessoryListParams = {}): Promise<PaginatedResult<Accessory>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, ...search } = params;
    const all = await fetchAllAccessories();
    const filtered = all.filter((item) => matchesSearch(item, search));
    const sorted = sortItems(filtered, search.sortBy);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async search(params: AccessorySearchParams): Promise<Accessory[]> {
    const all = await fetchAllAccessories();
    return sortItems(all.filter((item) => matchesSearch(item, params)), params.sortBy);
  }

  async findById(id: string): Promise<Accessory | null> {
    const { data, error } = await supabase
      .from('accessories')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data ? mapAccessory(data as AccessoryRow) : null;
  }

  async create(data: AccessoryCreate): Promise<Accessory> {
    const now = toIsoString(new Date());
    const record: Accessory = {
      ...data,
      id: generateId('acc'),
      createdAt: now,
      updatedAt: now,
    };
    const { data: inserted, error } = await supabase
      .from('accessories')
      .insert(toAccessoryRow(record))
      .select('*')
      .single();
    throwIfSupabaseError(error);
    notifyDataRefresh();
    return mapAccessory(inserted as AccessoryRow);
  }

  async update(id: string, data: AccessoryUpdate): Promise<Accessory> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Accessory ${id} not found`);
    const next: Accessory = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: toIsoString(new Date()),
    };
    const { data: updated, error } = await supabase
      .from('accessories')
      .update(toAccessoryRow(next))
      .eq('id', id)
      .select('*')
      .single();
    throwIfSupabaseError(error);
    notifyDataRefresh();
    return mapAccessory(updated as AccessoryRow);
  }

  async delete(id: string): Promise<void> {
    const accessory = await this.findById(id);
    if (!accessory) return;
    const { error } = await supabase.from('accessories').delete().eq('id', id);
    throwIfSupabaseError(error);
    const ids = [accessory.coverImageId, ...accessory.imageIds].filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
    if (ids.length > 0) {
      await imageRepository.deleteMany(ids);
    }
    notifyDataRefresh();
  }

  async duplicate(id: string): Promise<Accessory> {
    const source = await this.findById(id);
    if (!source) throw new Error(`Accessory ${id} not found`);
    return this.create({
      ...source,
      name: `${source.name} (Copy)`,
      quantity: 0,
      availability: false,
    });
  }

  async adjustQuantity(id: string, delta: number): Promise<Accessory> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Accessory ${id} not found`);
    const quantity = Math.max(0, existing.quantity + delta);
    const availability = quantity > 0;
    return this.update(id, { quantity, availability });
  }

  async countByCategory(): Promise<Record<AccessoryCategory, number>> {
    const all = await fetchAllAccessories();
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

export const accessoryRepository: AccessoryRepository = new SupabaseAccessoryRepository();
