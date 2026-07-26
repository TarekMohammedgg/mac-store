export const ACCESSORY_CATEGORIES = [
  'chargers',
  'cables',
  'mice',
  'keyboards',
  'monitors',
  'cases',
  'audio',
  'adapters',
  'stands',
  'storage',
  'other',
] as const;

export type AccessoryCategory = (typeof ACCESSORY_CATEGORIES)[number];

export const ACCESSORY_CATEGORY_LABELS: Record<AccessoryCategory, string> = {
  chargers: 'Chargers',
  cables: 'Cables',
  mice: 'Mice',
  keyboards: 'Keyboards',
  monitors: 'Monitors',
  cases: 'Cases & Sleeves',
  audio: 'Audio',
  adapters: 'Adapters',
  stands: 'Stands',
  storage: 'Storage',
  other: 'Other',
};
