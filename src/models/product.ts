import type {
  Availability,
  Condition,
  ProductCategory,
  StorageType,
} from '@/lib/constants';

export interface ProductSpecifications {
  [key: string]: string;
}

export interface Product {
  id: string;
  serialNumber: string;
  model: string;
  category: ProductCategory;
  cpu: string;
  ram: number;
  storage: number;
  storageType: StorageType;
  batteryHealth: number | null;
  cycleCount: number | null;
  condition: Condition;
  price: number;
  description: string;
  specifications: ProductSpecifications;
  purchaseDate: string | null;
  inventoryDate: string;
  internalNotes: string;
  availability: Availability;
  coverImageId: string | null;
  imageIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProductCreate = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type ProductUpdate = Partial<Omit<Product, 'id' | 'createdAt'>>;

export type PublicProduct = Omit<
  Product,
  'serialNumber' | 'purchaseDate' | 'inventoryDate' | 'internalNotes'
> & {
  showSerialNumber: boolean;
};
