'use client';

import { supabase } from '@/lib/supabase/client';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type {
  InventoryMovement,
  PaymentMethod,
  Sale,
  SaleItemType,
  MovementType,
} from '@/models/analytics';

interface SaleRow {
  id: string;
  sold_at: string;
  item_type: string;
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_cost: number | string;
  unit_price: number | string;
  discount: number | string;
  revenue: number | string;
  cost: number | string;
  profit: number | string;
  payment_method: string;
  notes: string;
  created_at: string;
}

interface MovementRow {
  id: string;
  moved_at: string;
  item_type: string;
  item_id: string;
  item_name: string;
  movement_type: string;
  quantity_delta: number;
  unit_cost: number | string | null;
  sale_id: string | null;
  notes: string;
  created_at: string;
}

function mapSale(row: SaleRow): Sale {
  return {
    id: row.id,
    soldAt: row.sold_at,
    itemType: row.item_type as SaleItemType,
    itemId: row.item_id,
    itemName: row.item_name,
    category: row.category,
    quantity: row.quantity,
    unitCost: Number(row.unit_cost),
    unitPrice: Number(row.unit_price),
    discount: Number(row.discount),
    revenue: Number(row.revenue),
    cost: Number(row.cost),
    profit: Number(row.profit),
    paymentMethod: row.payment_method as PaymentMethod,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  };
}

function mapMovement(row: MovementRow): InventoryMovement {
  return {
    id: row.id,
    movedAt: row.moved_at,
    itemType: row.item_type as SaleItemType,
    itemId: row.item_id,
    itemName: row.item_name,
    movementType: row.movement_type as MovementType,
    quantityDelta: row.quantity_delta,
    unitCost: row.unit_cost === null || row.unit_cost === undefined ? null : Number(row.unit_cost),
    saleId: row.sale_id,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  };
}

class AnalyticsRepository {
  async listSalesSince(isoDate: string): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('sold_at', isoDate)
      .order('sold_at', { ascending: false });
    throwIfSupabaseError(error);
    return ((data ?? []) as SaleRow[]).map(mapSale);
  }

  async listRecentSales(limit = 12): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false })
      .limit(limit);
    throwIfSupabaseError(error);
    return ((data ?? []) as SaleRow[]).map(mapSale);
  }

  async listMovementsSince(isoDate: string): Promise<InventoryMovement[]> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .gte('moved_at', isoDate)
      .order('moved_at', { ascending: false });
    throwIfSupabaseError(error);
    return ((data ?? []) as MovementRow[]).map(mapMovement);
  }
}

export const analyticsRepository = new AnalyticsRepository();
