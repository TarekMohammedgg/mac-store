/**
 * Seeds sales + inventory_movements for analytics demos.
 * Usage: node --env-file=.env scripts/seed-analytics.mjs
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

const PAYMENTS = ['cash', 'card', 'transfer', 'card', 'cash', 'card'];

function daysAgo(n, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 50), 0, 0);
  return d.toISOString();
}

function id(prefix, n) {
  return `${prefix}_${String(n).padStart(3, '0')}`;
}

function money(n) {
  // Egyptian electronics are quoted in whole pounds.
  return Math.round(n);
}

async function main() {
  const [{ data: products, error: pErr }, { data: accessories, error: aErr }] = await Promise.all([
    supabase.from('products').select('id, model, category, price, cost_price'),
    supabase.from('accessories').select('id, name, category, price, cost_price, quantity'),
  ]);
  if (pErr) throw pErr;
  if (aErr) throw aErr;
  if (!products?.length) throw new Error('No products to seed sales against');

  await supabase.from('inventory_movements').delete().neq('id', '');
  await supabase.from('sales').delete().neq('id', '');

  const sales = [];
  const movements = [];
  let saleN = 1;
  let moveN = 1;

  // Opening stock purchases (cost basis)
  for (const product of products) {
    const unitCost = Number(product.cost_price ?? product.price * 0.72);
    const mid = id('mov', moveN++);
    movements.push({
      id: mid,
      moved_at: daysAgo(95, 10),
      item_type: 'product',
      item_id: product.id,
      item_name: product.model,
      movement_type: 'purchase_in',
      quantity_delta: 1,
      unit_cost: unitCost,
      sale_id: null,
      notes: 'شراء افتتاحي / إعادة تخزين',
    });
  }
  for (const accessory of accessories ?? []) {
    const unitCost = Number(accessory.cost_price ?? accessory.price * 0.55);
    const qty = Math.max(accessory.quantity ?? 10, 10);
    const mid = id('mov', moveN++);
    movements.push({
      id: mid,
      moved_at: daysAgo(95, 10),
      item_type: 'accessory',
      item_id: accessory.id,
      item_name: accessory.name,
      movement_type: 'purchase_in',
      quantity_delta: qty,
      unit_cost: unitCost,
      sale_id: null,
      notes: 'مخزون إكسسوارات افتتاحي',
    });
  }

  // Device sales over last ~80 days (weighted toward popular models)
  const deviceWeights = products.flatMap((p, index) =>
    Array.from({ length: Math.max(1, 4 - index) }, () => p),
  );

  for (let day = 78; day >= 0; day -= 1) {
    const salesToday = day % 5 === 0 ? 2 : day % 3 === 0 ? 1 : day % 7 === 0 ? 1 : 0;
    for (let s = 0; s < salesToday; s += 1) {
      const product = deviceWeights[Math.floor(Math.random() * deviceWeights.length)];
      const unitCost = Number(product.cost_price ?? product.price * 0.72);
      const unitPrice = Number(product.price);
      const discount = Math.random() > 0.82 ? money(unitPrice * 0.05) : 0;
      const revenue = money(unitPrice - discount);
      const cost = money(unitCost);
      const profit = money(revenue - cost);
      const saleId = id('sale', saleN++);
      const soldAt = daysAgo(day, 11 + s * 3);
      sales.push({
        id: saleId,
        sold_at: soldAt,
        item_type: 'product',
        item_id: product.id,
        item_name: product.model,
        category: product.category,
        quantity: 1,
        unit_cost: unitCost,
        unit_price: unitPrice,
        discount,
        revenue,
        cost,
        profit,
        payment_method: PAYMENTS[saleN % PAYMENTS.length],
        notes: discount > 0 ? 'خصم عرض ترويجي' : '',
      });
      movements.push({
        id: id('mov', moveN++),
        moved_at: soldAt,
        item_type: 'product',
        item_id: product.id,
        item_name: product.model,
        movement_type: 'sale_out',
        quantity_delta: -1,
        unit_cost: unitCost,
        sale_id: saleId,
        notes: 'تم البيع',
      });
    }
  }

  // Accessory sales (higher volume)
  for (let day = 70; day >= 0; day -= 1) {
    if (day % 2 !== 0) continue;
    const accessory = accessories[Math.floor(Math.random() * accessories.length)];
    if (!accessory) continue;
    const qty = 1 + Math.floor(Math.random() * 3);
    const unitCost = Number(accessory.cost_price ?? accessory.price * 0.55);
    const unitPrice = Number(accessory.price);
    const revenue = money(unitPrice * qty);
    const cost = money(unitCost * qty);
    const profit = money(revenue - cost);
    const saleId = id('sale', saleN++);
    const soldAt = daysAgo(day, 15);
    sales.push({
      id: saleId,
      sold_at: soldAt,
      item_type: 'accessory',
      item_id: accessory.id,
      item_name: accessory.name,
      category: accessory.category,
      quantity: qty,
      unit_cost: unitCost,
      unit_price: unitPrice,
      discount: 0,
      revenue,
      cost,
      profit,
      payment_method: PAYMENTS[saleN % PAYMENTS.length],
      notes: '',
    });
    movements.push({
      id: id('mov', moveN++),
      moved_at: soldAt,
      item_type: 'accessory',
      item_id: accessory.id,
      item_name: accessory.name,
      movement_type: 'sale_out',
      quantity_delta: -qty,
      unit_cost: unitCost,
      sale_id: saleId,
      notes: 'تم البيع',
    });
  }

  const { error: salesError } = await supabase.from('sales').upsert(sales);
  if (salesError) throw salesError;
  const { error: movError } = await supabase.from('inventory_movements').upsert(movements);
  if (movError) throw movError;

  console.log('Analytics seed complete:', {
    sales: sales.length,
    movements: movements.length,
    revenue: money(sales.reduce((a, s) => a + s.revenue, 0)),
    profit: money(sales.reduce((a, s) => a + s.profit, 0)),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
