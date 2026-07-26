import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(120, 'Too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200, 'Too long'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(200, 'Too long'),
    confirmPassword: z.string().min(6, 'Confirm password is required').max(200, 'Too long'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
