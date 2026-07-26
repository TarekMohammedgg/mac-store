'use client';

import * as React from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SelectField, TextAreaField, TextField } from '@/components/forms/form-fields';
import { settingsService } from '@/services/settings.service';
import { authService } from '@/services/auth.service';
import { useSettingsStore } from '@/stores/settings.store';
import { createDefaultSocialLinks, SOCIAL_PLATFORMS } from '@/models/settings';
import { generateId } from '@/lib/utils';
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
  socialLinks: createDefaultSocialLinks(),
};

export default function AdminSettingsPage() {
  const { t, dictionary } = useI18n();

  React.useEffect(() => {
    void settingsService.ensureSeeded();
  }, []);

  const settings = useCachedLiveQuery('admin-settings', () => settingsService.get(), []);

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: EMPTY_SETTINGS,
  });

  const { fields, append, remove } = useFieldArray({
    control: settingsForm.control,
    name: 'socialLinks',
    keyName: '_key',
  });

  React.useEffect(() => {
    if (!settings) return;
    settingsForm.reset({
      storeName: settings.storeName,
      storeDescription: settings.storeDescription,
      contactEmail: settings.contactEmail,
      currency: settings.currency,
      showSerialNumber: settings.showSerialNumber,
      socialLinks: settings.socialLinks.length
        ? settings.socialLinks
        : createDefaultSocialLinks(),
    });
  }, [settings, settingsForm]);

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const platformOptions = SOCIAL_PLATFORMS.map((platform) => ({
    value: platform,
    label: dictionary.settings.socialPlatforms[platform],
  }));

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
      socialLinks: next.socialLinks,
    });
    toast.success(t('toast.settingsReset'));
  };

  const addSocialLink = () => {
    append({
      id: generateId('social'),
      platform: 'other',
      label: '',
      url: '',
    });
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

            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <Label>{t('settings.store.socialLinks')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('settings.store.socialLinksHint')}
                </p>
              </div>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field._key}
                    className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_minmax(0,1.4fr)_auto]"
                  >
                    <SelectField
                      control={settingsForm.control}
                      name={`socialLinks.${index}.platform`}
                      label={t('settings.store.socialPlatform')}
                      options={platformOptions}
                    />
                    <TextField
                      control={settingsForm.control}
                      name={`socialLinks.${index}.label`}
                      label={t('settings.store.socialLabel')}
                      required
                    />
                    <TextField
                      control={settingsForm.control}
                      name={`socialLinks.${index}.url`}
                      label={t('settings.store.socialUrl')}
                      placeholder="https://"
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('settings.store.removeSocialLink')}
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
                <Plus className="h-4 w-4" />
                {t('settings.store.addSocialLink')}
              </Button>
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
