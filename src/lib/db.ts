'use client';

import Dexie, { type Table } from 'dexie';

import type { Accessory } from '@/models/accessory';
import type { StoredImage } from '@/models/image';
import type { Product } from '@/models/product';
import type { AppSettings } from '@/models/settings';
import type { AdminUser } from '@/models/user';

export interface SessionRecord {
  token: string;
  username: string;
  createdAt: string;
  expiresAt: string;
}

export class InventoryDB extends Dexie {
  products!: Table<Product, string>;
  accessories!: Table<Accessory, string>;
  images!: Table<StoredImage, string>;
  users!: Table<AdminUser, string>;
  settings!: Table<AppSettings, string>;
  authSessions!: Table<SessionRecord, string>;

  constructor() {
    super('mac_store_inventory');
    this.version(1).stores({
      products:
        'id, model, category, cpu, ram, storage, condition, price, availability, createdAt, updatedAt, serialNumber',
      accessories: 'id, name, category, price, availability, createdAt, updatedAt',
      images: 'id, createdAt',
      users: 'id, username',
      settings: 'id',
      authSessions: 'token, expiresAt',
    });
  }
}

let dbInstance: InventoryDB | null = null;

export function getDb(): InventoryDB {
  if (typeof window === 'undefined') {
    throw new Error('Dexie database is only available in the browser.');
  }
  if (!dbInstance) {
    dbInstance = new InventoryDB();
  }
  return dbInstance;
}
