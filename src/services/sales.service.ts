'use client';

import { salesRepository, type RecordSaleInput } from '@/repositories/sales.repository';
import type { Sale } from '@/models/analytics';

class SalesService {
  listRecent(limit = 20): Promise<Sale[]> {
    return salesRepository.listRecent(limit);
  }

  async record(input: RecordSaleInput): Promise<Sale> {
    if (!input.itemId.trim()) throw new Error('Item is required');
    if (input.quantity <= 0) throw new Error('Quantity must be greater than 0');
    if (input.unitPrice < 0) throw new Error('Sale price cannot be negative');
    if ((input.discount ?? 0) < 0) throw new Error('Discount cannot be negative');
    return salesRepository.create(input);
  }
}

export const salesService = new SalesService();
