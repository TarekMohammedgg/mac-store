'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TextAreaField, TextField } from '@/components/forms/form-fields';
import { settingsService } from '@/services/settings.service';
import { authService } from '@/services/auth.service';
import { getDb } from '@/lib/db';
import {
  settingsFormSchema,
  type SettingsFormValues,
} from '@/validation/settings.schema';
import { changePasswordSchema, type ChangePasswordValues } from '@/validation/auth.schema';

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const settings = useLiveQuery(async () => settingsService.get(), []);

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      storeName: '',
      storeDescription: '',
      contactEmail: '',
      currency: 'EGP',
      showSerialNumber: false,
    },
  });

  React.useEffect(() => {
    if (settings) {
      settingsForm.reset({
        storeName: settings.storeName,
        storeDescription: settings.storeDescription,
        contactEmail: settings.contactEmail,
        currency: settings.currency,
        showSerialNumber: settings.showSerialNumber,
      });
    }
  }, [settings, settingsForm]);

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSaveSettings = settingsForm.handleSubmit(async (values) => {
    try {
      await settingsService.update(values);
      toast.success(t('toast.settingsSaved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saveFailed', t('nav.settings').toLowerCase()));
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
    settingsForm.reset({
      storeName: next.storeName,
      storeDescription: next.storeDescription,
      contactEmail: next.contactEmail,
      currency: next.currency,
      showSerialNumber: next.showSerialNumber,
    });
    toast.success(t('toast.settingsReset'));
  };

  const onSeedSample = async () => {
    if (!window.confirm(t('settings.data.addSample') + '?')) return;
    const db = getDb();
    const now = new Date().toISOString();
    const products = [
      {
        id: `prd_sample_1_${Date.now()}`,
        model: 'MacBook Pro 14"',
        serialNumber: `SAMPLE-${Math.floor(Math.random() * 10000)}`,
        category: 'macbook-pro' as const,
        cpu: 'Apple M2 Pro',
        ram: 16,
        storage: 512,
        storageType: 'SSD' as const,
        batteryHealth: 95,
        cycleCount: 32,
        condition: 'excellent' as const,
        price: 1899,
        description: 'A refurbished MacBook Pro in excellent condition.',
        specifications: { Year: '2023', Color: 'Space Gray' },
        purchaseDate: null,
        inventoryDate: now,
        internalNotes: '',
        availability: 'available' as const,
        coverImageId: null,
        imageIds: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `prd_sample_2_${Date.now()}`,
        model: 'iPad Pro 12.9"',
        serialNumber: `SAMPLE-${Math.floor(Math.random() * 10000)}`,
        category: 'ipad-pro' as const,
        cpu: 'Apple M2',
        ram: 8,
        storage: 256,
        storageType: 'SSD' as const,
        batteryHealth: 100,
        cycleCount: 0,
        condition: 'like-new' as const,
        price: 999,
        description: 'Like-new iPad Pro with M2 chip.',
        specifications: { Year: '2022', Color: 'Silver' },
        purchaseDate: null,
        inventoryDate: now,
        internalNotes: '',
        availability: 'available' as const,
        coverImageId: null,
        imageIds: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
    const accessories = [
      {
        id: `acc_sample_1_${Date.now()}`,
        name: 'Magic Mouse',
        category: 'mice' as const,
        quantity: 12,
        price: 79,
        description: 'Wireless and rechargeable.',
        coverImageId: null,
        imageIds: [],
        availability: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `acc_sample_2_${Date.now()}`,
        name: 'USB-C Charger 20W',
        category: 'chargers' as const,
        quantity: 30,
        price: 19,
        description: 'Compact fast charger.',
        coverImageId: null,
        imageIds: [],
        availability: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.products.bulkPut(products);
    await db.accessories.bulkPut(accessories);
    toast.success(t('toast.sampleAdded'));
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
              <Switch
                id="showSerial"
                checked={settingsForm.watch('showSerialNumber')}
                onCheckedChange={(checked) =>
                  settingsForm.setValue('showSerialNumber', checked, { shouldDirty: true })
                }
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.data.title')}</CardTitle>
          <CardDescription>{t('settings.data.description')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">{t('settings.data.sampleHint')}</div>
            <Button variant="outline" onClick={onSeedSample}>
              {t('settings.data.addSample')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">{t('settings.storage.description')}</p>
    </div>
  );
}
