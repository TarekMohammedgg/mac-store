import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generateId(prefix?: string): string {
  const random = Math.random().toString(36).slice(2, 11);
  const time = Date.now().toString(36);
  return prefix ? `${prefix}_${time}${random}` : `${time}${random}`;
}

export function toIsoString(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function fromDateInputValue(value: string): string {
  if (!value) return new Date().toISOString();
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Number('') === 0; blank filter fields must use the fallback instead.
    if (!trimmed) return fallback;
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

export function uniqueBy<T, K>(items: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
