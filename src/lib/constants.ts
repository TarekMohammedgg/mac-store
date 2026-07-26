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
