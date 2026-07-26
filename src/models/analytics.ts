export type SaleItemType = 'product' | 'accessory';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';
export type MovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'adjustment'
  | 'return_in'
  | 'write_off';

export interface Sale {
  id: string;
  soldAt: string;
  itemType: SaleItemType;
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  listPrice: number;
  discount: number;
  revenue: number;
  cost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  movedAt: string;
  itemType: SaleItemType;
  itemId: string;
  itemName: string;
  movementType: MovementType;
  quantityDelta: number;
  unitCost: number | null;
  saleId: string | null;
  notes: string;
  createdAt: string;
}

export interface NamedMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  secondary?: number;
}

export interface TrendPoint {
  date: string;
  revenue: number;
  profit: number;
  units: number;
}

export interface CategoryMix {
  category: string;
  revenue: number;
  profit: number;
  units: number;
  share: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

export interface AnalyticsInsights {
  periodDays: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  unitsSold: number;
  averageOrderValue: number;
  inventoryRetailValue: number;
  inventoryCostValue: number;
  potentialGrossProfit: number;
  revenueTrend: TrendPoint[];
  topByRevenue: NamedMetric[];
  topByUnits: NamedMetric[];
  categoryMix: CategoryMix[];
  paymentMix: { method: PaymentMethod; revenue: number; share: number }[];
  lowStockAccessories: LowStockItem[];
  slowMovers: NamedMetric[];
  recentSales: Sale[];
}
