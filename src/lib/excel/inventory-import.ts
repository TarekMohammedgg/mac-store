import * as XLSX from 'xlsx';

import type { AccessoryCategory } from '@/lib/accessory-constants';
import type { Condition, ProductCategory, StorageType } from '@/lib/constants';
import type { AccessoryCreate } from '@/models/accessory';
import type { ProductCreate } from '@/models/product';
import { toIsoString } from '@/lib/utils';

export type ImportMode = 'all' | 'products' | 'accessories';

export type ImportRowError = {
  sheet: string;
  row: number;
  message: string;
};

/** How an Excel column relates to a store field during review. */
export type ColumnMappingKind = 'matched' | 'folded' | 'ignored' | 'missing';

export type ColumnMapping = {
  kind: ColumnMappingKind;
  /** Raw header from the file (empty for missing store fields). */
  excelHeader: string;
  /** Store field the UI shows (e.g. name, price, category). */
  storeField: string;
  /** Human detail: default value, fold target, why ignored. */
  note: string;
};

export type SheetMappingReport = {
  sheet: string;
  kind: 'products' | 'accessories' | 'skipped';
  foundHeaders: string[];
  mappings: ColumnMapping[];
  rowCount: number;
};

/** One data row as shown in the Excel-like preview table. */
export type ExcelPreviewRow = {
  sourceRow: number;
  cells: string[];
};

export type ExcelPreviewSheet = {
  sheet: string;
  kind: 'products' | 'accessories';
  headers: string[];
  rows: ExcelPreviewRow[];
};

export type ParsedInventoryImport = {
  products: ProductCreate[];
  accessories: AccessoryCreate[];
  skippedSheets: string[];
  errors: ImportRowError[];
  sheetReports: SheetMappingReport[];
  previewSheets: ExcelPreviewSheet[];
  mode: ImportMode;
};

const PRODUCT_SHEETS = new Set(['laptop', 'imac & display.', 'imac & display', 'mac pro']);
const ACCESSORY_SHEETS = new Set(['accessories.', 'accessories']);
const SKIP_SHEETS = new Set(['spare parts.', 'spare parts']);

type CanonicalKey =
  | 'price'
  | 'year'
  | 'model'
  | 'inch'
  | 'cpu'
  | 'ram'
  | 'storage'
  | 'cycle'
  | 'warranty'
  | 'gpu'
  | 'info'
  | 'unknown';

const PRODUCT_STORE_FIELDS = [
  'model',
  'price',
  'year',
  'screenSize',
  'cpu',
  'ram',
  'storage',
  'cycleCount',
  'batteryHealth',
  'gpu',
  'warranty',
  'category',
  'quantity',
  'serialNumber',
  'condition',
] as const;

const ACCESSORY_STORE_FIELDS = [
  'name',
  'price',
  'category',
  'quantity',
  'description',
  'availability',
] as const;

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase();
}

function displayHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function classifyHeader(raw: unknown): CanonicalKey {
  const key = normalizeHeader(raw);
  if (!key) return 'unknown';
  if (key.includes('warrent') || key.includes('warrant')) return 'warranty';
  if (key.includes('model') || key === 'name' || key.includes('اسم')) return 'model';
  if (key === 'inch' || key.includes('inch') || key.includes('screen')) return 'inch';
  if (key === 'cpu' || key.includes('processor')) return 'cpu';
  if (key === 'ram' || key.includes('memory')) return 'ram';
  if (key === 'storage' || key.includes('ssd') || key.includes('hdd')) return 'storage';
  if (key.includes('cycle') || key.includes('battery')) return 'cycle';
  if (key === 'gpu' || key.includes('graphics')) return 'gpu';
  if (key === 'price' || key.includes('سعر')) return 'price';
  if (key === 'year' || key.includes('year') || key.includes('سنة')) return 'year';
  if (key === 'info' || key === 'notes' || key.includes('وصف') || key === 'description') {
    return 'info';
  }
  return 'unknown';
}

function cellText(value: unknown): string {
  if (value == null) return '';
  return String(value).replace(/\u00a0/g, ' ').trim();
}

function parseYear(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[^\d]/g, ''));
  if (!Number.isFinite(n) || n < 1990 || n > 2100) return null;
  return Math.round(n);
}

function parsePrice(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseRamGb(value: unknown): number {
  const text = cellText(value);
  if (!text) return 8;
  const match = text.match(/(\d+(?:\.\d+)?)\s*(GB|TB)?/i);
  if (!match) return 8;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 8;
  if ((match[2] ?? '').toUpperCase() === 'TB') return Math.round(amount * 1024);
  return Math.max(1, Math.round(amount));
}

function parseStorage(value: unknown): { storage: number; storageType: StorageType; note: string | null } {
  const text = cellText(value);
  if (!text) return { storage: 256, storageType: 'SSD', note: null };

  const tb = text.match(/(\d+(?:\.\d+)?)\s*TB/i);
  const gb = text.match(/(\d+(?:\.\d+)?)\s*GB/i);
  let storage = 256;
  if (tb) storage = Math.round(Number(tb[1]) * 1024);
  else if (gb) storage = Math.round(Number(gb[1]));

  const hasSsd = /ssd|flash/i.test(text);
  const hasHdd = /hdd/i.test(text);
  const storageType: StorageType = hasHdd && !hasSsd ? 'HDD' : 'SSD';
  const note = text.includes('+') || (hasSsd && hasHdd) ? text : null;
  return { storage: Math.max(1, storage), storageType, note };
}

function parseCycleAndHealth(value: unknown): {
  cycleCount: number | null;
  batteryHealth: number | null;
} {
  const text = cellText(value);
  if (!text) return { cycleCount: null, batteryHealth: null };

  const paired = text.match(/(\d+)\s*\|\s*(\d+)\s*%?/);
  if (paired) {
    return {
      cycleCount: Number(paired[1]),
      batteryHealth: Math.min(100, Number(paired[2])),
    };
  }

  const only = text.match(/(\d+)/);
  return { cycleCount: only ? Number(only[1]) : null, batteryHealth: null };
}

function inferProductCategory(model: string, sheetName: string): ProductCategory {
  const m = model.toLowerCase();
  if (m.includes('macbook air')) return 'macbook-air';
  if (m.includes('macbook pro') || m.includes('macbook')) return 'macbook-pro';
  if (m.includes('imac')) return 'imac';
  if (m.includes('mac mini') || m.includes('macmini')) return 'mac-mini';
  if (m.includes('mac studio')) return 'mac-studio';
  if (m.includes('mac pro')) return 'mac-pro';
  if (m.includes('ipad pro')) return 'ipad-pro';
  if (m.includes('ipad air')) return 'ipad-air';
  if (m.includes('ipad mini')) return 'ipad-mini';
  if (m.includes('ipad')) return 'ipad';
  if (m.includes('iphone')) return 'iphone';
  if (m.includes('watch')) return 'apple-watch';
  if (m.includes('airpods')) return 'airpods';

  const sheet = sheetName.toLowerCase();
  if (sheet.includes('mac pro')) return 'mac-pro';
  if (sheet.includes('imac')) return 'imac';
  if (sheet.includes('laptop')) return 'macbook-pro';
  return 'other';
}

function inferCondition(warranty: string): Condition {
  const text = warranty.toLowerCase();
  if (/\bnew\b/.test(text)) return 'new';
  if (/like\s*-?\s*new/.test(text)) return 'like-new';
  return 'excellent';
}

function inferAccessoryCategory(name: string): AccessoryCategory {
  const n = name.toLowerCase();
  if (n.includes('mouse')) return 'mice';
  if (n.includes('keyboard') || n.includes('key board')) return 'keyboards';
  if (n.includes('cable') || n.includes('lightning') || n.includes('usb-c') || n.includes('usbc')) {
    return 'cables';
  }
  if (n.includes('charger') || n.includes('adapter') || n.includes('power')) return 'chargers';
  if (n.includes('monitor') || n.includes('display')) return 'monitors';
  if (n.includes('case') || n.includes('sleeve')) return 'cases';
  if (n.includes('stand') || n.includes('dock')) return 'stands';
  if (n.includes('ssd') || n.includes('hdd') || n.includes('storage') || n.includes('drive')) {
    return 'storage';
  }
  if (n.includes('airpods') || n.includes('earpod') || n.includes('headset') || n.includes('speaker')) {
    return 'audio';
  }
  if (n.includes('hub') || n.includes('dongle') || n.includes('converter')) return 'adapters';
  return 'other';
}

function headerIndexMap(headers: unknown[]): Map<CanonicalKey, number> {
  const map = new Map<CanonicalKey, number>();
  headers.forEach((header, index) => {
    const key = classifyHeader(header);
    if (key === 'unknown') return;
    if (!map.has(key)) map.set(key, index);
  });
  return map;
}

function getCell(row: unknown[], map: Map<CanonicalKey, number>, key: CanonicalKey): unknown {
  const index = map.get(key);
  if (index == null) return undefined;
  return row[index];
}

function buildSerial(index: number): string {
  return `IMP-${Date.now().toString(36).toUpperCase()}-${String(index + 1).padStart(3, '0')}`;
}

function rawHeaders(row: unknown[] | undefined): string[] {
  if (!row) return [];
  return row
    .map((cell) => displayHeader(cell))
    .filter((header) => header.length > 0);
}

function analyzeProductHeaders(headers: unknown[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const claimed = new Set<number>();
  const byKey = headerIndexMap(headers);

  const pushMatched = (
    key: CanonicalKey,
    storeField: string,
    note = '',
  ) => {
    const index = byKey.get(key);
    if (index == null) return false;
    claimed.add(index);
    mappings.push({
      kind: 'matched',
      excelHeader: displayHeader(headers[index]),
      storeField,
      note,
    });
    return true;
  };

  pushMatched('model', 'model');
  pushMatched('price', 'price');
  pushMatched('year', 'year');
  pushMatched('inch', 'screenSize');
  pushMatched('cpu', 'cpu');
  pushMatched('ram', 'ram');
  pushMatched('storage', 'storage');
  if (pushMatched('cycle', 'cycleCount', 'also fills batteryHealth when formatted like 121 | 100%')) {
    mappings.push({
      kind: 'folded',
      excelHeader: displayHeader(headers[byKey.get('cycle')!]),
      storeField: 'batteryHealth',
      note: 'from Cycle Count (N | N%)',
    });
  }
  pushMatched('gpu', 'gpu');
  pushMatched('warranty', 'warranty');
  if (byKey.has('info')) {
    const index = byKey.get('info')!;
    claimed.add(index);
    mappings.push({
      kind: 'folded',
      excelHeader: displayHeader(headers[index]),
      storeField: 'description',
      note: 'merged into description / notes',
    });
  }

  headers.forEach((header, index) => {
    const label = displayHeader(header);
    if (!label || claimed.has(index)) return;
    mappings.push({
      kind: 'ignored',
      excelHeader: label,
      storeField: '—',
      note: 'not used for devices — remove from sheet or ignore',
    });
  });

  const presentStore = new Set(mappings.map((item) => item.storeField));
  for (const field of PRODUCT_STORE_FIELDS) {
    if (presentStore.has(field)) continue;
    const defaults: Record<string, string> = {
      category: 'inferred from model / sheet name',
      quantity: 'defaults to 1',
      serialNumber: 'auto-generated (IMP-…)',
      condition: 'defaults to excellent (or new if warranty says New)',
      batteryHealth: 'optional — leave empty if unknown',
      cycleCount: 'optional — leave empty if unknown',
      year: 'optional',
      screenSize: 'optional',
      gpu: 'optional',
      warranty: 'optional',
      cpu: 'defaults to Unknown if empty',
      ram: 'defaults to 8 if empty',
      storage: 'defaults to 256 if empty',
    };
    if (!defaults[field] && (field === 'model' || field === 'price')) {
      mappings.push({
        kind: 'missing',
        excelHeader: '',
        storeField: field,
        note: 'required — add this column before import',
      });
      continue;
    }
    mappings.push({
      kind: 'missing',
      excelHeader: '',
      storeField: field,
      note: defaults[field] ?? 'optional',
    });
  }

  return mappings;
}

function analyzeAccessoryHeaders(headers: unknown[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const claimed = new Set<number>();
  const byKey = headerIndexMap(headers);

  const claim = (key: CanonicalKey, storeField: string, kind: ColumnMappingKind, note: string) => {
    const index = byKey.get(key);
    if (index == null) return;
    claimed.add(index);
    mappings.push({
      kind,
      excelHeader: displayHeader(headers[index]),
      storeField,
      note,
    });
  };

  claim('model', 'name', 'matched', 'Model Info → accessory name');
  claim('price', 'price', 'matched', '');
  claim('info', 'description', 'folded', 'merged into description');
  claim('warranty', 'description', 'folded', 'appended to description');
  claim('year', 'description', 'folded', 'appended to description as Year');

  // Device-only columns on an accessories import are noise.
  const deviceOnly: CanonicalKey[] = ['inch', 'cpu', 'ram', 'storage', 'cycle', 'gpu'];
  for (const key of deviceOnly) {
    const index = byKey.get(key);
    if (index == null) continue;
    claimed.add(index);
    mappings.push({
      kind: 'ignored',
      excelHeader: displayHeader(headers[index]),
      storeField: '—',
      note: 'device column — not used for accessories, remove it',
    });
  }

  headers.forEach((header, index) => {
    const label = displayHeader(header);
    if (!label || claimed.has(index)) return;
    mappings.push({
      kind: 'ignored',
      excelHeader: label,
      storeField: '—',
      note: 'not used for accessories — remove from sheet or ignore',
    });
  });

  const presentStore = new Set(mappings.filter((m) => m.kind !== 'ignored').map((m) => m.storeField));
  for (const field of ACCESSORY_STORE_FIELDS) {
    if (presentStore.has(field)) continue;
    const defaults: Record<string, string> = {
      category: 'inferred from name (mouse → Mice, …)',
      quantity: 'defaults to 1',
      description: 'built from info / warranty / year when present',
      availability: 'defaults to available',
    };
    if (field === 'name' || field === 'price') {
      mappings.push({
        kind: 'missing',
        excelHeader: '',
        storeField: field,
        note: 'required — add Model Info / Price',
      });
      continue;
    }
    mappings.push({
      kind: 'missing',
      excelHeader: '',
      storeField: field,
      note: defaults[field] ?? 'optional',
    });
  }

  return mappings;
}

function countDataRows(rows: unknown[][]): number {
  let count = 0;
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    if (row.every((cell) => cell == null || cellText(cell) === '')) continue;
    count += 1;
  }
  return count;
}

function formatCellPreview(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  return cellText(value);
}

function extractPreviewSheet(
  sheetName: string,
  kind: 'products' | 'accessories',
  rows: unknown[][],
): ExcelPreviewSheet {
  const headerRow = rows[0] ?? [];
  const headers = rawHeaders(headerRow);
  const headerIndexes = headerRow
    .map((cell, index) => ({ label: displayHeader(cell), index }))
    .filter((item) => item.label.length > 0);

  const previewRows: ExcelPreviewRow[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    if (row.every((cell) => cell == null || cellText(cell) === '')) continue;
    previewRows.push({
      sourceRow: i + 1,
      cells: headerIndexes.map(({ index }) => formatCellPreview(row[index])),
    });
  }

  return { sheet: sheetName, kind, headers, rows: previewRows };
}

function rowFromHeadersAndCells(headers: string[], cells: string[]): unknown[] {
  return headers.map((_, index) => cells[index] ?? '');
}

export function productFromPreviewCells(
  sheetName: string,
  headers: string[],
  cells: string[],
  index: number,
): { product?: ProductCreate; error?: string } {
  const map = headerIndexMap(headers);
  const row = rowFromHeadersAndCells(headers, cells);
  const model = cellText(getCell(row, map, 'model'));
  const price = parsePrice(getCell(row, map, 'price'));
  if (!model) return { error: 'Missing model' };
  if (price == null) return { error: `Missing price for "${model}"` };

  const cpu = cellText(getCell(row, map, 'cpu')) || 'Unknown';
  const { storage, storageType, note: storageNote } = parseStorage(getCell(row, map, 'storage'));
  const { cycleCount, batteryHealth } = parseCycleAndHealth(getCell(row, map, 'cycle'));
  const warranty = cellText(getCell(row, map, 'warranty')) || null;
  const gpu = cellText(getCell(row, map, 'gpu')) || null;
  const screenSize = cellText(getCell(row, map, 'inch')) || null;
  const year = parseYear(getCell(row, map, 'year'));
  const now = toIsoString(new Date());

  return {
    product: {
      serialNumber: buildSerial(index),
      model,
      category: inferProductCategory(model, sheetName),
      cpu,
      ram: parseRamGb(getCell(row, map, 'ram')),
      storage,
      storageType,
      batteryHealth,
      cycleCount,
      condition: inferCondition(warranty ?? ''),
      price,
      quantity: 1,
      description: '',
      specifications: {},
      purchaseDate: year ? `${year}-01-01` : null,
      inventoryDate: now,
      internalNotes: storageNote ? `Storage note: ${storageNote}` : '',
      availability: 'available',
      coverImageId: null,
      imageIds: [],
      costPrice: null,
      year,
      screenSize,
      gpu,
      warranty,
    },
  };
}

export function accessoryFromPreviewCells(
  headers: string[],
  cells: string[],
): { accessory?: AccessoryCreate; error?: string } {
  const map = headerIndexMap(headers);
  const row = rowFromHeadersAndCells(headers, cells);
  const name = cellText(getCell(row, map, 'model'));
  const price = parsePrice(getCell(row, map, 'price'));
  if (!name) return { error: 'Missing accessory name' };
  if (price == null) return { error: `Missing price for "${name}"` };

  const info = cellText(getCell(row, map, 'info'));
  const warranty = cellText(getCell(row, map, 'warranty'));
  const year = parseYear(getCell(row, map, 'year'));
  const description = [info, warranty, year ? `Year: ${year}` : null].filter(Boolean).join(' · ');

  return {
    accessory: {
      name,
      category: inferAccessoryCategory(name),
      quantity: 1,
      price,
      description,
      coverImageId: null,
      imageIds: [],
      availability: true,
      costPrice: null,
    },
  };
}

export function materializeImportFromPreviewSheets(
  sheets: ExcelPreviewSheet[],
): { products: ProductCreate[]; accessories: AccessoryCreate[]; errors: ImportRowError[] } {
  const products: ProductCreate[] = [];
  const accessories: AccessoryCreate[] = [];
  const errors: ImportRowError[] = [];
  let productIndex = 0;

  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      if (sheet.kind === 'products') {
        const result = productFromPreviewCells(
          sheet.sheet,
          sheet.headers,
          row.cells,
          productIndex,
        );
        if (result.error) {
          errors.push({ sheet: sheet.sheet, row: row.sourceRow, message: result.error });
          continue;
        }
        if (result.product) {
          products.push(result.product);
          productIndex += 1;
        }
        continue;
      }

      const result = accessoryFromPreviewCells(sheet.headers, row.cells);
      if (result.error) {
        errors.push({ sheet: sheet.sheet, row: row.sourceRow, message: result.error });
        continue;
      }
      if (result.accessory) accessories.push(result.accessory);
    }
  }

  return { products, accessories, errors };
}

function parseProductSheet(
  sheetName: string,
  rows: unknown[][],
  startIndex: number,
): {
  products: ProductCreate[];
  errors: ImportRowError[];
  nextIndex: number;
  report: SheetMappingReport;
  preview: ExcelPreviewSheet;
} {
  const preview = extractPreviewSheet(sheetName, 'products', rows);
  const products: ProductCreate[] = [];
  const errors: ImportRowError[] = [];
  const headers = rows[0] ?? [];
  const report: SheetMappingReport = {
    sheet: sheetName,
    kind: 'products',
    foundHeaders: rawHeaders(headers),
    mappings: analyzeProductHeaders(headers),
    rowCount: 0,
  };

  if (rows.length < 2) return { products, errors, nextIndex: startIndex, report, preview };

  const map = headerIndexMap(headers);
  if (!map.has('model') || !map.has('price')) {
    errors.push({
      sheet: sheetName,
      row: 1,
      message: 'Missing required headers (Model Info / Price)',
    });
    return { products, errors, nextIndex: startIndex, report, preview };
  }

  let index = startIndex;
  for (const previewRow of preview.rows) {
    const result = productFromPreviewCells(
      sheetName,
      preview.headers,
      previewRow.cells,
      index,
    );
    if (result.error) {
      errors.push({ sheet: sheetName, row: previewRow.sourceRow, message: result.error });
      continue;
    }
    if (result.product) {
      products.push(result.product);
      index += 1;
    }
  }

  report.rowCount = products.length;
  return { products, errors, nextIndex: index, report, preview };
}

function parseAccessorySheet(
  sheetName: string,
  rows: unknown[][],
): {
  accessories: AccessoryCreate[];
  errors: ImportRowError[];
  report: SheetMappingReport;
  preview: ExcelPreviewSheet;
} {
  const preview = extractPreviewSheet(sheetName, 'accessories', rows);
  const accessories: AccessoryCreate[] = [];
  const errors: ImportRowError[] = [];
  const headers = rows[0] ?? [];
  const report: SheetMappingReport = {
    sheet: sheetName,
    kind: 'accessories',
    foundHeaders: rawHeaders(headers),
    mappings: analyzeAccessoryHeaders(headers),
    rowCount: 0,
  };

  if (rows.length < 2) return { accessories, errors, report, preview };

  const map = headerIndexMap(headers);
  if (!map.has('model') || !map.has('price')) {
    errors.push({
      sheet: sheetName,
      row: 1,
      message: 'Missing required headers (Model Info / Price)',
    });
    return { accessories, errors, report, preview };
  }

  for (const previewRow of preview.rows) {
    const result = accessoryFromPreviewCells(preview.headers, previewRow.cells);
    if (result.error) {
      errors.push({ sheet: sheetName, row: previewRow.sourceRow, message: result.error });
      continue;
    }
    if (result.accessory) accessories.push(result.accessory);
  }

  report.rowCount = accessories.length;
  return { accessories, errors, report, preview };
}

function sheetToRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });
}

function toUint8Array(input: ArrayBuffer | Uint8Array | Buffer): Uint8Array {
  if (input instanceof Uint8Array) return input;
  return new Uint8Array(input);
}

function shouldTakeProducts(mode: ImportMode): boolean {
  return mode === 'all' || mode === 'products';
}

function shouldTakeAccessories(mode: ImportMode): boolean {
  return mode === 'all' || mode === 'accessories';
}

/**
 * Parses inventory Excel workbooks shaped like the store sheet.
 * Pass `mode` to focus products, accessories, or both.
 */
export function parseInventoryWorkbook(
  input: ArrayBuffer | Uint8Array | Buffer,
  mode: ImportMode = 'all',
): ParsedInventoryImport {
  const workbook = XLSX.read(toUint8Array(input), { type: 'array' });
  const products: ProductCreate[] = [];
  const accessories: AccessoryCreate[] = [];
  const skippedSheets: string[] = [];
  const errors: ImportRowError[] = [];
  const sheetReports: SheetMappingReport[] = [];
  const previewSheets: ExcelPreviewSheet[] = [];
  let productIndex = 0;

  for (const sheetName of workbook.SheetNames) {
    const normalized = sheetName.trim().toLowerCase();
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = sheetToRows(sheet);
    const headers = rows[0] ?? [];

    if (PRODUCT_SHEETS.has(normalized)) {
      if (!shouldTakeProducts(mode)) {
        sheetReports.push({
          sheet: sheetName,
          kind: 'skipped',
          foundHeaders: rawHeaders(headers),
          mappings: [],
          rowCount: countDataRows(rows),
        });
        skippedSheets.push(sheetName);
        continue;
      }
      const parsed = parseProductSheet(sheetName, rows, productIndex);
      products.push(...parsed.products);
      errors.push(...parsed.errors);
      sheetReports.push(parsed.report);
      previewSheets.push(parsed.preview);
      productIndex = parsed.nextIndex;
      continue;
    }

    if (ACCESSORY_SHEETS.has(normalized)) {
      if (!shouldTakeAccessories(mode)) {
        sheetReports.push({
          sheet: sheetName,
          kind: 'skipped',
          foundHeaders: rawHeaders(headers),
          mappings: [],
          rowCount: countDataRows(rows),
        });
        skippedSheets.push(sheetName);
        continue;
      }
      const parsed = parseAccessorySheet(sheetName, rows);
      accessories.push(...parsed.accessories);
      errors.push(...parsed.errors);
      sheetReports.push(parsed.report);
      previewSheets.push(parsed.preview);
      continue;
    }

    if (SKIP_SHEETS.has(normalized) || rows.length === 0) {
      skippedSheets.push(sheetName);
      sheetReports.push({
        sheet: sheetName,
        kind: 'skipped',
        foundHeaders: rawHeaders(headers),
        mappings: [],
        rowCount: countDataRows(rows),
      });
      continue;
    }

    skippedSheets.push(sheetName);
    sheetReports.push({
      sheet: sheetName,
      kind: 'skipped',
      foundHeaders: rawHeaders(headers),
      mappings: [],
      rowCount: countDataRows(rows),
    });
  }

  return { products, accessories, skippedSheets, errors, sheetReports, previewSheets, mode };
}
