import { z } from 'zod';

import {
  AVAILABILITY_OPTIONS,
  CONDITIONS,
  PRODUCT_CATEGORIES,
  STORAGE_TYPES,
} from '@/lib/constants';

const numericString = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === 'number' ? value : Number(value)))
  .refine((value) => !Number.isNaN(value), { message: 'Must be a number' });

const optionalNumericString = numericString.optional().or(z.literal('').transform(() => undefined));

const dateString = z
  .string()
  .refine((value) => value === '' || !Number.isNaN(new Date(value).getTime()), {
    message: 'Invalid date',
  })
  .optional()
  .or(z.literal('').transform(() => undefined));

export const productFormSchema = z.object({
  model: z.string().min(1, 'Model is required').max(120, 'Too long'),
  serialNumber: z.string().min(1, 'Serial number is required').max(120, 'Too long'),
  category: z.enum(PRODUCT_CATEGORIES),
  cpu: z.string().min(1, 'CPU is required').max(120, 'Too long'),
  ram: numericString.pipe(z.number().int().min(1, 'RAM must be at least 1 GB').max(2048)),
  storage: numericString.pipe(z.number().int().min(1, 'Storage must be at least 1 GB').max(8192)),
  storageType: z.enum(STORAGE_TYPES),
  batteryHealth: optionalNumericString.pipe(
    z.number().int().min(0).max(100).optional(),
  ),
  cycleCount: optionalNumericString.pipe(
    z.number().int().min(0).max(20000).optional(),
  ),
  condition: z.enum(CONDITIONS),
  price: numericString.pipe(z.number().min(0, 'Price must be at least 0')),
  quantity: numericString.pipe(z.number().int().min(0, 'Quantity must be at least 0')),
  description: z.string().max(2000, 'Too long').default(''),
  specifications: z
    .array(
      z.object({
        key: z.string().min(1, 'Key is required'),
        value: z.string().min(1, 'Value is required'),
      }),
    )
    .default([]),
  purchaseDate: dateString,
  inventoryDate: z.string().min(1, 'Inventory date is required'),
  internalNotes: z.string().max(2000, 'Too long').default(''),
  availability: z.enum(AVAILABILITY_OPTIONS),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
