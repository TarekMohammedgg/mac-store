'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Apple, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useI18n } from '@/i18n';
import { loginSchema, type LoginValues } from '@/validation/auth.schema';
import { useAuthStore } from '@/stores/auth.store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.username, values.password);
      toast.success(t('login.success'));
      const next = searchParams?.get('next') || '/admin';
      router.replace(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('login.failed'));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="username">{t('login.username')}</Label>
        <Input id="username" autoComplete="username" {...register('username')} />
        {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('login.password')}</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {t('login.submit')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </>
        )}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const { t, dictionary } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Apple className="h-5 w-5" /> {dictionary.brand.name}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{t('login.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('login.description')}</p>
        </div>
        <React.Suspense
          fallback={
            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
              {t('common.loading')}
            </div>
          }
        >
          <LoginForm />
        </React.Suspense>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            {t('login.backLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
