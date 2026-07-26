'use client';

import { supabase } from '@/lib/supabase/client';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { mapSaleRow, type SaleRow } from '@/repositories/sales.repository';
import type {
  InventoryMovement,
  Sale,
  SaleItemType,
  MovementType,
} from '@/models/analytics';

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
    return ((data ?? []) as SaleRow[]).map(mapSaleRow);
  }

  async listRecentSales(limit = 12): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    throwIfSupabaseError(error);
    return ((data ?? []) as SaleRow[]).map(mapSaleRow);
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
