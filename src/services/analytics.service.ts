'use client';

import { productService } from '@/services/product.service';
import { analyticsRepository } from '@/repositories/analytics.repository';
import type {
  AnalyticsInsights,
  CategoryMix,
  NamedMetric,
  Sale,
  TrendPoint,
} from '@/models/analytics';

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDayKey(iso: string): string {
  return iso.slice(0, 10);
}

function onlyProducts(sales: Sale[]): Sale[] {
  return sales.filter((sale) => sale.itemType === 'product');
}

function buildTrend(sales: Sale[], days: number): TrendPoint[] {
  const today = startOfDay(new Date());
  const map = new Map<string, TrendPoint>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { date: key, revenue: 0, profit: 0, units: 0 });
  }
  for (const sale of sales) {
    const key = toDayKey(sale.soldAt);
    const point = map.get(key);
    if (!point) continue;
    point.revenue = money(point.revenue + sale.revenue);
    point.profit = money(point.profit + sale.profit);
    point.units += sale.quantity;
  }
  return Array.from(map.values());
}

function rankByRevenue(sales: Sale[], limit = 8): NamedMetric[] {
  const map = new Map<string, NamedMetric>();
  for (const sale of sales) {
    const current = map.get(sale.itemId) ?? {
      id: sale.itemId,
      name: sale.itemName,
      category: sale.category,
      value: 0,
      secondary: 0,
    };
    current.value = money(current.value + sale.revenue);
    current.secondary = (current.secondary ?? 0) + sale.quantity;
    map.set(sale.itemId, current);
  }
  return Array.from(map.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function rankByUnits(sales: Sale[], limit = 8): NamedMetric[] {
  const map = new Map<string, NamedMetric>();
  for (const sale of sales) {
    const current = map.get(sale.itemId) ?? {
      id: sale.itemId,
      name: sale.itemName,
      category: sale.category,
      value: 0,
      secondary: 0,
    };
    current.value += sale.quantity;
    current.secondary = money((current.secondary ?? 0) + sale.revenue);
    map.set(sale.itemId, current);
  }
  return Array.from(map.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function buildCategoryMix(sales: Sale[]): CategoryMix[] {
  const map = new Map<string, CategoryMix>();
  let totalRevenue = 0;
  for (const sale of sales) {
    totalRevenue += sale.revenue;
    const current = map.get(sale.category) ?? {
      category: sale.category,
      revenue: 0,
      profit: 0,
      units: 0,
      share: 0,
    };
    current.revenue = money(current.revenue + sale.revenue);
    current.profit = money(current.profit + sale.profit);
    current.units += sale.quantity;
    map.set(sale.category, current);
  }
  return Array.from(map.values())
    .map((item) => ({
      ...item,
      share: totalRevenue > 0 ? money((item.revenue / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

class AnalyticsService {
  async getInsights(periodDays = 30): Promise<AnalyticsInsights> {
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - (periodDays - 1));
    const sinceIso = since.toISOString();

    const [allSales, products, recentAll] = await Promise.all([
      analyticsRepository.listSalesSince(sinceIso),
      productService.search({}),
      analyticsRepository.listRecentSales(20),
    ]);

    const sales = onlyProducts(allSales);
    const recentSales = onlyProducts(recentAll).slice(0, 12);

    const revenue = money(sales.reduce((sum, sale) => sum + sale.revenue, 0));
    const cost = money(sales.reduce((sum, sale) => sum + sale.cost, 0));
    const profit = money(sales.reduce((sum, sale) => sum + sale.profit, 0));
    const unitsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const orderCount = sales.length;
    const marginPercent = revenue > 0 ? money((profit / revenue) * 100) : 0;
    const averageOrderValue = orderCount > 0 ? money(revenue / orderCount) : 0;

    const availableProducts = products.filter((p) => p.availability === 'available');
    const inventoryRetailValue = money(
      availableProducts.reduce((sum, p) => sum + p.price, 0),
    );
    const inventoryCostValue = money(
      availableProducts.reduce((sum, p) => sum + (p.costPrice ?? p.price * 0.72), 0),
    );
    const potentialGrossProfit = money(inventoryRetailValue - inventoryCostValue);

    const soldIds = new Set(sales.map((sale) => sale.itemId));
    const slowMovers: NamedMetric[] = availableProducts
      .filter((p) => !soldIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.model,
        category: p.category,
        value: p.price,
        secondary: p.costPrice ?? undefined,
      }))
      .slice(0, 8);

    return {
      periodDays,
      revenue,
      cost,
      profit,
      marginPercent,
      unitsSold,
      averageOrderValue,
      inventoryRetailValue,
      inventoryCostValue,
      potentialGrossProfit,
      revenueTrend: buildTrend(sales, periodDays),
      topByRevenue: rankByRevenue(sales),
      topByUnits: rankByUnits(sales),
      categoryMix: buildCategoryMix(sales),
      paymentMix: [],
      lowStockAccessories: [],
      slowMovers,
      recentSales,
    };
  }
}

export const analyticsService = new AnalyticsService();
