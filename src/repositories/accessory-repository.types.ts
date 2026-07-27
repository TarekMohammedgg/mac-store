import type { Accessory, AccessoryCreate, AccessoryUpdate } from '@/models/accessory';
import type { AccessoryCategory } from '@/lib/accessory-constants';

import type { PaginatedResult } from './product-repository.types';

export type { PaginatedResult };

export interface AccessorySearchParams {
  query?: string;
  category?: AccessoryCategory | 'all';
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean;
  sortBy?: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name';
}

export interface AccessoryListParams extends AccessorySearchParams {
  page?: number;
  pageSize?: number;
}

export interface AccessoryRepository {
  list(params?: AccessoryListParams): Promise<PaginatedResult<Accessory>>;
  search(params: AccessorySearchParams): Promise<Accessory[]>;
  findById(id: string): Promise<Accessory | null>;
  create(data: AccessoryCreate): Promise<Accessory>;
  createMany(items: AccessoryCreate[]): Promise<Accessory[]>;
  update(id: string, data: AccessoryUpdate): Promise<Accessory>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<Accessory>;
  adjustQuantity(id: string, delta: number): Promise<Accessory>;
  countByCategory(): Promise<Record<AccessoryCategory, number>>;
}
