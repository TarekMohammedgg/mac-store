'use client';

import { useMemo } from 'react';

import { useI18n } from '@/i18n';
import type { AccessoryCategory } from '@/lib/accessory-constants';
import type { Availability, Condition, ProductCategory, StorageType } from '@/lib/constants';

export interface LocalizedLabels {
  productCategory: (key: ProductCategory) => string;
  accessoryCategory: (key: AccessoryCategory) => string;
  condition: (key: Condition) => string;
  availability: (key: Availability | 'inStock' | 'outOfStock') => string;
  storageType: (key: StorageType) => string;
}

export function useLocalizedLabels(): LocalizedLabels {
  const { dictionary } = useI18n();
  return useMemo<LocalizedLabels>(() => {
    const availability = (key: Availability | 'inStock' | 'outOfStock') => {
      if (key === 'inStock' || key === 'outOfStock') {
        return dictionary.availability[key];
      }
      return dictionary.availability[key as Exclude<Availability, 'inStock' | 'outOfStock'>];
    };
    return {
      productCategory: (key) => dictionary.productCategories[key],
      accessoryCategory: (key) => dictionary.accessoryCategories[key],
      condition: (key) => dictionary.conditions[key],
      availability,
      storageType: (key) => dictionary.storageTypes[key],
    };
  }, [dictionary]);
}
