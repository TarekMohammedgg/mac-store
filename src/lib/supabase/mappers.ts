import type { Accessory } from '@/models/accessory';
import {
  createDefaultSocialLinks,
  type AppSettings,
  type SocialLink,
  type SocialPlatform,
} from '@/models/settings';
import type { Product } from '@/models/product';
import type { Condition, ProductCategory, StorageType, Availability } from '@/lib/constants';
import type { AccessoryCategory } from '@/lib/accessory-constants';

export interface ImageRow {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  storage_path: string;
  created_at: string;
}

export interface ProductRow {
  id: string;
  serial_number: string;
  model: string;
  category: string;
  cpu: string;
  ram: number;
  storage: number;
  storage_type: string;
  battery_health: number | null;
  cycle_count: number | null;
  condition: string;
  price: number | string;
  description: string;
  specifications: Record<string, string> | null;
  purchase_date: string | null;
  inventory_date: string;
  internal_notes: string;
  availability: string;
  cover_image_id: string | null;
  image_ids: string[] | null;
  cost_price: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessoryRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number | string;
  description: string;
  cover_image_id: string | null;
  image_ids: string[] | null;
  availability: boolean;
  cost_price: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingsRow {
  id: string;
  store_name: string;
  store_description: string;
  contact_email: string;
  currency: string;
  show_serial_number: boolean;
  default_admin_username: string;
  social_links: SocialLink[] | null;
  updated_at: string;
}

function mapSocialLinks(value: SocialLink[] | null | undefined): SocialLink[] {
  if (!Array.isArray(value) || value.length === 0) return createDefaultSocialLinks();
  return value.map((link) => ({
    id: String(link.id ?? ''),
    platform: (link.platform ?? 'other') as SocialPlatform,
    label: String(link.label ?? ''),
    url: String(link.url ?? ''),
  }));
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    serialNumber: row.serial_number,
    model: row.model,
    category: row.category as ProductCategory,
    cpu: row.cpu,
    ram: row.ram,
    storage: row.storage,
    storageType: row.storage_type as StorageType,
    batteryHealth: row.battery_health,
    cycleCount: row.cycle_count,
    condition: row.condition as Condition,
    price: Number(row.price),
    description: row.description ?? '',
    specifications: row.specifications ?? {},
    purchaseDate: row.purchase_date,
    inventoryDate: row.inventory_date,
    internalNotes: row.internal_notes ?? '',
    availability: row.availability as Availability,
    coverImageId: row.cover_image_id,
    imageIds: row.image_ids ?? [],
    costPrice: row.cost_price === null || row.cost_price === undefined ? null : Number(row.cost_price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toProductRow(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): Record<string, unknown> {
  return {
    ...(product.id ? { id: product.id } : {}),
    serial_number: product.serialNumber,
    model: product.model,
    category: product.category,
    cpu: product.cpu,
    ram: product.ram,
    storage: product.storage,
    storage_type: product.storageType,
    battery_health: product.batteryHealth,
    cycle_count: product.cycleCount,
    condition: product.condition,
    price: product.price,
    description: product.description,
    specifications: product.specifications,
    purchase_date: product.purchaseDate,
    inventory_date: product.inventoryDate,
    internal_notes: product.internalNotes,
    availability: product.availability,
    cover_image_id: product.coverImageId,
    image_ids: product.imageIds,
    cost_price: product.costPrice,
    ...(product.createdAt ? { created_at: product.createdAt } : {}),
    ...(product.updatedAt ? { updated_at: product.updatedAt } : {}),
  };
}

export function mapAccessory(row: AccessoryRow): Accessory {
  return {
    id: row.id,
    name: row.name,
    category: row.category as AccessoryCategory,
    quantity: row.quantity,
    price: Number(row.price),
    description: row.description ?? '',
    coverImageId: row.cover_image_id,
    imageIds: row.image_ids ?? [],
    availability: row.availability,
    costPrice: row.cost_price === null || row.cost_price === undefined ? null : Number(row.cost_price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAccessoryRow(
  accessory: Omit<Accessory, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): Record<string, unknown> {
  return {
    ...(accessory.id ? { id: accessory.id } : {}),
    name: accessory.name,
    category: accessory.category,
    quantity: accessory.quantity,
    price: accessory.price,
    description: accessory.description,
    cover_image_id: accessory.coverImageId,
    image_ids: accessory.imageIds,
    availability: accessory.availability,
    cost_price: accessory.costPrice,
    ...(accessory.createdAt ? { created_at: accessory.createdAt } : {}),
    ...(accessory.updatedAt ? { updated_at: accessory.updatedAt } : {}),
  };
}

export function mapSettings(row: SettingsRow): AppSettings {
  return {
    id: 'app',
    storeName: row.store_name,
    storeDescription: row.store_description,
    contactEmail: row.contact_email,
    currency: row.currency,
    showSerialNumber: row.show_serial_number,
    defaultAdminUsername: row.default_admin_username,
    socialLinks: mapSocialLinks(row.social_links),
    updatedAt: row.updated_at,
  };
}

export function toSettingsRow(settings: AppSettings): SettingsRow {
  return {
    id: 'app',
    store_name: settings.storeName,
    store_description: settings.storeDescription,
    contact_email: settings.contactEmail,
    currency: settings.currency,
    show_serial_number: settings.showSerialNumber,
    default_admin_username: settings.defaultAdminUsername,
    social_links: settings.socialLinks,
    updated_at: settings.updatedAt,
  };
}
