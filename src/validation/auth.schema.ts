import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(200, 'Too long')
    .refine(
      (value) => {
        const trimmed = value.trim().toLowerCase();
        if (trimmed === 'admin') return true;
        return z.string().email().safeParse(trimmed).success;
      },
      { message: 'Enter a valid email' },
    ),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200, 'Too long'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const signUpSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email').max(200, 'Too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200, 'Too long'),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

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
