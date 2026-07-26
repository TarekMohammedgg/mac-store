'use client';

import { supabase } from '@/lib/supabase/client';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { notifyDataRefresh } from '@/lib/data-refresh';
import type { PaymentMethod, Sale, SaleItemType } from '@/models/analytics';

export interface SaleRow {
  id: string;
  sold_at: string;
  item_type: string;
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_cost: number | string;
  unit_price: number | string;
  list_price: number | string | null;
  discount: number | string;
  revenue: number | string;
  cost: number | string;
  profit: number | string;
  payment_method: string;
  notes: string;
  created_at: string;
}

export interface RecordSaleInput {
  itemType: SaleItemType;
  itemId: string;
  quantity: number;
  unitPrice: number;
  soldAt?: string;
  paymentMethod?: PaymentMethod;
  discount?: number;
  notes?: string;
}

export function mapSaleRow(row: SaleRow): Sale {
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
    listPrice: Number(row.list_price ?? row.unit_price),
    discount: Number(row.discount),
    revenue: Number(row.revenue),
    cost: Number(row.cost),
    profit: Number(row.profit),
    paymentMethod: row.payment_method as PaymentMethod,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  };
}

class SalesRepository {
  async listRecent(limit = 20): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    throwIfSupabaseError(error);
    return ((data ?? []) as SaleRow[]).map(mapSaleRow);
  }

  async create(input: RecordSaleInput): Promise<Sale> {
    const { data, error } = await supabase.rpc('record_sale', {
      p_item_type: input.itemType,
      p_item_id: input.itemId,
      p_quantity: input.quantity,
      p_unit_price: input.unitPrice,
      p_sold_at: input.soldAt ?? new Date().toISOString(),
      p_payment_method: input.paymentMethod ?? 'cash',
      p_discount: input.discount ?? 0,
      p_notes: input.notes ?? '',
    });
    throwIfSupabaseError(error);
    const row = (Array.isArray(data) ? data[0] : data) as SaleRow | null;
    if (!row) throw new Error('Sale was not returned from record_sale');
    notifyDataRefresh();
    return mapSaleRow(row);
  }
}

export const salesRepository = new SalesRepository();
