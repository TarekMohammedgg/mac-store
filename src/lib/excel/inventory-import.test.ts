import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseInventoryWorkbook } from '@/lib/excel/inventory-import';

describe('parseInventoryWorkbook review data', () => {
  const buffer = readFileSync('d:/18-1-2026.xlsx');

  it('keeps product sheets active and marks other sheets skipped without fake removals for import', () => {
    const parsed = parseInventoryWorkbook(buffer, 'products');
    const productReports = parsed.sheetReports.filter((report) => report.kind === 'products');
    const skipped = parsed.sheetReports.filter((report) => report.kind === 'skipped');

    expect(productReports.length).toBeGreaterThanOrEqual(3);
    expect(parsed.products.length).toBeGreaterThan(50);
    expect(parsed.accessories.length).toBe(0);

    // Skipped sheets exist, but active product mappings should not be "ignored" for real columns.
    for (const report of productReports) {
      const ignoredReal = report.mappings.filter(
        (m) => m.kind === 'ignored' && m.excelHeader.length > 0,
      );
      expect(ignoredReal.length).toBe(0);
      expect(report.mappings.some((m) => m.kind === 'matched' && m.storeField === 'model')).toBe(
        true,
      );
    }

    expect(skipped.some((report) => /accessor/i.test(report.sheet))).toBe(true);
    expect(skipped.some((report) => /spare/i.test(report.sheet))).toBe(true);
  });

  it('supports editing-ready accessory drafts from accessories mode', () => {
    const parsed = parseInventoryWorkbook(buffer, 'accessories');
    expect(parsed.accessories.length).toBeGreaterThan(5);
    expect(parsed.accessories.every((item) => item.name && item.price >= 0)).toBe(true);
  });
});
