import { z } from 'zod';

import { ACCESSORY_CATEGORIES } from '@/lib/accessory-constants';

const numericString = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === 'number' ? value : Number(value)))
  .refine((value) => !Number.isNaN(value), { message: 'Must be a number' });

export const accessoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120, 'Too long'),
  category: z.enum(ACCESSORY_CATEGORIES),
  quantity: numericString.pipe(z.number().int().min(0, 'Quantity cannot be negative')),
  price: numericString.pipe(z.number().min(0, 'Price must be at least 0')),
  description: z.string().max(2000, 'Too long').default(''),
  availability: z.boolean().default(true),
});

export type AccessoryFormValues = z.infer<typeof accessoryFormSchema>;
