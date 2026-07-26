import { z } from 'zod';

import { SOCIAL_PLATFORMS } from '@/models/settings';

export const socialLinkSchema = z.object({
  id: z.string().min(1),
  platform: z.enum(SOCIAL_PLATFORMS),
  label: z.string().min(1, 'Label is required').max(60, 'Too long'),
  url: z
    .string()
    .max(500, 'Too long')
    .refine((value) => value === '' || /^https?:\/\//i.test(value), {
      message: 'URL must start with http:// or https://',
    }),
});

export const settingsFormSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(120, 'Too long'),
  storeDescription: z.string().max(500, 'Too long'),
  contactEmail: z.string().email('Invalid email').max(200, 'Too long'),
  currency: z.string().min(2, 'Currency is required').max(8, 'Too long'),
  showSerialNumber: z.boolean(),
  socialLinks: z.array(socialLinkSchema).max(12, 'Too many social links'),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
