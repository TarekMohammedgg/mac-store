'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { BrandLogo } from '@/components/brand/brand-logo';
import { SettingsMenu } from '@/components/layout/settings-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useI18n } from '@/i18n';
import { useStoreBrandName } from '@/stores/settings.store';
import {
  loginSchema,
  signUpSchema,
  type LoginValues,
  type SignUpValues,
} from '@/validation/auth.schema';
import { useAuthStore } from '@/stores/auth.store';

function readNextPath(): string {
  if (typeof window === 'undefined') return '/admin';
  return new URLSearchParams(window.location.search).get('next') || '/admin';
}

function redirectAfterAuth(role: 'admin' | 'user', router: ReturnType<typeof useRouter>) {
  if (role === 'admin') {
    const next = readNextPath();
    router.replace(next.startsWith('/admin') ? next : '/admin');
    return;
  }
  router.replace('/');
}

function LoginForm({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const signUp = useAuthStore((state) => state.signUp);
  const loading = useAuthStore((state) => state.loading);
  const { t } = useI18n();

  const signInForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const form = mode === 'signin' ? signInForm : signUpForm;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === 'signin') {
        await login(values.email, values.password);
      } else {
        await signUp(values.email, values.password);
      }
      const session = useAuthStore.getState().session;
      toast.success(t('login.success'));
      redirectAfterAuth(session?.role === 'admin' ? 'admin' : 'user', router);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('login.failed'));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm" aria-busy={loading}>
      <div className="space-y-2">
        <Label htmlFor="email">{t('login.email')}</Label>
        <Input
          id="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          placeholder={mode === 'signin' ? 'admin@macstore.local' : 'you@example.com'}
          disabled={loading}
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('login.password')}</Label>
        <PasswordInput
          id="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          disabled={loading}
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {mode === 'signin' ? t('login.submitting') : t('login.signingUp')}
          </>
        ) : (
          <>
            {mode === 'signin' ? t('login.submit') : t('login.signUp')}{' '}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </>
        )}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { t, dictionary } = useI18n();
  const brandName = useStoreBrandName(dictionary.brand.name);
  const session = useAuthStore((state) => state.session);
  const hydrated = useAuthStore((state) => state.hydrated);
  const initialized = useAuthStore((state) => state.initialized);
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');

  React.useEffect(() => {
    if (!hydrated || !initialized || !session) return;
    redirectAfterAuth(session.role, router);
  }, [hydrated, initialized, session, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="absolute end-4 top-4 sm:end-6 sm:top-6">
        <SettingsMenu />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex flex-col items-center gap-3 text-lg font-semibold tracking-tight">
            <BrandLogo size="xl" alt={brandName} priority />
            <span>{brandName}</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'signin' ? t('login.title') : t('login.signUpTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' ? t('login.description') : t('login.signUpDescription')}
          </p>
        </div>
        <LoginForm mode={mode} />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? (
            <>
              {t('login.noAccount')}{' '}
              <button
                type="button"
                className="text-foreground underline-offset-4 hover:underline"
                onClick={() => setMode('signup')}
              >
                {t('login.signUp')}
              </button>
            </>
          ) : (
            <>
              {t('login.hasAccount')}{' '}
              <button
                type="button"
                className="text-foreground underline-offset-4 hover:underline"
                onClick={() => setMode('signin')}
              >
                {t('login.submit')}
              </button>
            </>
          )}
        </p>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            {t('login.backLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
