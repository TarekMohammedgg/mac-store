'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TextAreaField, TextField } from '@/components/forms/form-fields';
import { settingsService } from '@/services/settings.service';
import { authService } from '@/services/auth.service';
import { useSettingsStore } from '@/stores/settings.store';
import {
  settingsFormSchema,
  type SettingsFormValues,
} from '@/validation/settings.schema';
import { changePasswordSchema, type ChangePasswordValues } from '@/validation/auth.schema';

const EMPTY_SETTINGS: SettingsFormValues = {
  storeName: '',
  storeDescription: '',
  contactEmail: '',
  currency: 'EGP',
  showSerialNumber: false,
};

export default function AdminSettingsPage() {
  const { t } = useI18n();

  React.useEffect(() => {
    void settingsService.ensureSeeded();
  }, []);

  const settings = useCachedLiveQuery('admin-settings', () => settingsService.get(), []);

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: EMPTY_SETTINGS,
  });

  React.useEffect(() => {
    if (!settings) return;
    settingsForm.reset({
      storeName: settings.storeName,
      storeDescription: settings.storeDescription,
      contactEmail: settings.contactEmail,
      currency: settings.currency,
      showSerialNumber: settings.showSerialNumber,
    });
  }, [settings, settingsForm]);

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSaveSettings = settingsForm.handleSubmit(async (values) => {
    try {
      await useSettingsStore.getState().updateSettings(values);
      toast.success(t('toast.settingsSaved'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('toast.saveFailed', t('nav.settings').toLowerCase()),
      );
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      toast.success(t('toast.passwordUpdated'));
      passwordForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('toast.passwordUpdateFailed'),
      );
    }
  });

  const onReset = async () => {
    if (!window.confirm(t('common.reset') + '?')) return;
    const next = await settingsService.reset();
    useSettingsStore.getState().setSettings(next);
    settingsForm.reset({
      storeName: next.storeName,
      storeDescription: next.storeDescription,
      contactEmail: next.contactEmail,
      currency: next.currency,
      showSerialNumber: next.showSerialNumber,
    });
    toast.success(t('toast.settingsReset'));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('settings.hint')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.store.title')}</CardTitle>
          <CardDescription>{t('settings.store.description')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={onSaveSettings} className="space-y-4">
            <TextField
              control={settingsForm.control}
              name="storeName"
              label={t('settings.store.storeName')}
              required
            />
            <TextAreaField
              control={settingsForm.control}
              name="storeDescription"
              label={t('settings.store.storeDescription')}
              rows={2}
            />
            <TextField
              control={settingsForm.control}
              name="contactEmail"
              label={t('settings.store.contactEmail')}
              type="email"
              required
            />
            <TextField
              control={settingsForm.control}
              name="currency"
              label={t('settings.store.currency')}
              required
            />
            <div className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div>
                <Label htmlFor="showSerial">{t('settings.store.showSerial')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.store.showSerialHint')}</p>
              </div>
              <Controller
                control={settingsForm.control}
                name="showSerialNumber"
                render={({ field }) => (
                  <Switch
                    id="showSerial"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onReset}>
                {t('settings.store.reset')}
              </Button>
              <Button type="submit">
                {settingsForm.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t('settings.store.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.account.title')}</CardTitle>
          <CardDescription>{t('settings.account.description')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={onChangePassword} className="space-y-4">
            <TextField
              control={passwordForm.control}
              name="currentPassword"
              label={t('settings.account.currentPassword')}
              type="password"
              required
              autoComplete="current-password"
            />
            <TextField
              control={passwordForm.control}
              name="newPassword"
              label={t('settings.account.newPassword')}
              type="password"
              required
              autoComplete="new-password"
            />
            <TextField
              control={passwordForm.control}
              name="confirmPassword"
              label={t('settings.account.confirmPassword')}
              type="password"
              required
              autoComplete="new-password"
            />
            <div className="flex justify-end">
              <Button type="submit">
                {passwordForm.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t('settings.account.update')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">{t('settings.storage.description')}</p>
    </div>
  );
}
