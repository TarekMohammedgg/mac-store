import type { Product, ProductCreate, ProductUpdate } from '@/models/product';
import type {
  Availability,
  Condition,
  ProductCategory,
} from '@/lib/constants';

export interface ProductSearchParams {
  query?: string;
  category?: ProductCategory | 'all';
  condition?: Condition | 'all';
  minPrice?: number;
  maxPrice?: number;
  minRam?: number;
  maxRam?: number;
  minStorage?: number;
  maxStorage?: number;
  cpu?: string;
  availability?: Availability | 'all';
  onlyAvailable?: boolean;
  sortBy?: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'model';
}

export interface ProductListParams extends ProductSearchParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductRepository {
  list(params?: ProductListParams): Promise<PaginatedResult<Product>>;
  search(params: ProductSearchParams): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(data: ProductCreate): Promise<Product>;
  update(id: string, data: ProductUpdate): Promise<Product>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<Product>;
  adjustQuantity(id: string, delta: number): Promise<Product>;
  countByAvailability(): Promise<Record<Availability, number>>;
  countByCategory(): Promise<Record<ProductCategory, number>>;
}

export type { ProductCreate, ProductUpdate };
