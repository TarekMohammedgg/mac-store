import { z } from 'zod';

export const settingsFormSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(120, 'Too long'),
  storeDescription: z.string().max(500, 'Too long'),
  contactEmail: z.string().email('Invalid email').max(200, 'Too long'),
  currency: z.string().min(2, 'Currency is required').max(8, 'Too long'),
  showSerialNumber: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
