export const PRODUCT_CATEGORIES = [
  'macbook-air',
  'macbook-pro',
  'imac',
  'mac-mini',
  'mac-studio',
  'mac-pro',
  'ipad',
  'ipad-pro',
  'ipad-air',
  'ipad-mini',
  'iphone',
  'apple-watch',
  'airpods',
  'other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  'macbook-air': 'MacBook Air',
  'macbook-pro': 'MacBook Pro',
  imac: 'iMac',
  'mac-mini': 'Mac Mini',
  'mac-studio': 'Mac Studio',
  'mac-pro': 'Mac Pro',
  ipad: 'iPad',
  'ipad-pro': 'iPad Pro',
  'ipad-air': 'iPad Air',
  'ipad-mini': 'iPad Mini',
  iphone: 'iPhone',
  'apple-watch': 'Apple Watch',
  airpods: 'AirPods',
  other: 'Other',
};

export const CONDITIONS = ['new', 'like-new', 'excellent', 'good', 'fair'] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_LABELS: Record<Condition, string> = {
  new: 'New',
  'like-new': 'Like New',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
};

export const AVAILABILITY_OPTIONS = [
  'available',
  'reserved',
  'sold',
  'unavailable',
] as const;
export type Availability = (typeof AVAILABILITY_OPTIONS)[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
  unavailable: 'Unavailable',
};

export const STORAGE_TYPES = ['SSD', 'HDD'] as const;
export type StorageType = (typeof STORAGE_TYPES)[number];

/** Common Apple chip labels for catalog filters (Mac / iPad / iPhone). */
export const PRODUCT_CPU_FILTER_OPTIONS = [
  'M1',
  'M1 Pro',
  'M1 Max',
  'M1 Ultra',
  'M2',
  'M2 Pro',
  'M2 Max',
  'M2 Ultra',
  'M3',
  'M3 Pro',
  'M3 Max',
  'M4',
  'M4 Pro',
  'M4 Max',
  'M5',
  'M5 Pro',
  'M5 Max',
  'Intel',
  'A15',
  'A16',
  'A17 Pro',
  'A18',
  'A18 Pro',
] as const;

/** Common unified-memory / RAM sizes (GB) for Apple devices. */
export const PRODUCT_RAM_FILTER_OPTIONS = [8, 16, 18, 24, 32, 36, 48, 64, 96, 128] as const;

/** Common storage sizes (GB) for Apple devices. */
export const PRODUCT_STORAGE_FILTER_OPTIONS = [128, 256, 512, 1024, 2048] as const;

/**
 * Matches a product CPU string against a filter chip label.
 * "M3" matches "Apple M3 Pro"; "M1" does not match "M10".
 */
export function matchesCpuFilter(productCpu: string, filter: string): boolean {
  const needle = filter.trim().toLowerCase();
  if (!needle || needle === 'all') return true;
  const text = productCpu.toLowerCase();
  let from = 0;
  while (from <= text.length) {
    const idx = text.indexOf(needle, from);
    if (idx === -1) return false;
    const after = text[idx + needle.length];
    if (!after || !/[0-9]/.test(after)) return true;
    from = idx + 1;
  }
  return false;
}

export function formatStorageFilterLabel(gb: number): string {
  if (gb >= 1024 && gb % 1024 === 0) {
    const tb = gb / 1024;
    return `${tb} TB`;
  }
  return `${gb} GB`;
}

export function formatRamFilterLabel(gb: number): string {
  return `${gb} GB`;
}

/**
 * Typical Egyptian-market device price steps (EGP) for Mac / iPhone / iPad filters.
 * Covers used phones ~10k up through high-end MacBook ~150–200k.
 */
export const PRODUCT_PRICE_FILTER_OPTIONS = [
  10_000, 15_000, 20_000, 25_000, 30_000, 40_000, 50_000, 60_000, 70_000, 80_000, 100_000,
  120_000, 150_000, 200_000,
] as const;

/** Typical accessory price steps (EGP) — chargers to Magic Keyboard. */
export const ACCESSORY_PRICE_FILTER_OPTIONS = [
  500, 1_000, 1_500, 2_000, 3_000, 5_000, 7_500, 10_000, 15_000, 20_000,
] as const;
