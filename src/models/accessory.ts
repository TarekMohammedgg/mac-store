import type { AccessoryCategory } from '@/lib/accessory-constants';

export interface Accessory {
  id: string;
  name: string;
  category: AccessoryCategory;
  quantity: number;
  price: number;
  description: string;
  coverImageId: string | null;
  imageIds: string[];
  availability: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccessoryCreate = Omit<Accessory, 'id' | 'createdAt' | 'updatedAt'>;
export type AccessoryUpdate = Partial<Omit<Accessory, 'id' | 'createdAt'>>;
