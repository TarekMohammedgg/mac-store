'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/shared/image-uploader';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SelectField, TextAreaField, TextField } from '@/components/forms/form-fields';
import { ACCESSORY_CATEGORIES, type AccessoryCategory } from '@/lib/accessory-constants';
import { buildInitialImages, type LocalImagePreview } from '@/hooks/use-local-images';
import { accessoryService } from '@/services/accessory.service';
import { repositories } from '@/repositories';
import {
  accessoryFormSchema,
  type AccessoryFormValues,
} from '@/validation/accessory.schema';
import type { Accessory } from '@/models/accessory';

const ACCESSORY_CATEGORY_KEYS: AccessoryCategory[] = [...ACCESSORY_CATEGORIES];

interface AccessoryFormProps {
  accessory?: Accessory;
  onSuccess: (accessory: Accessory) => void;
  onCancel: () => void;
}

export function AccessoryForm({ accessory, onSuccess, onCancel }: AccessoryFormProps) {
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const [submitting, setSubmitting] = React.useState(false);
  const [images, setImages] = React.useState<LocalImagePreview[]>([]);
  const [initialImagesReady, setInitialImagesReady] = React.useState(!accessory);

  const { control, handleSubmit, watch, setValue } = useForm<AccessoryFormValues>({
    resolver: zodResolver(accessoryFormSchema),
    defaultValues: buildDefaults(accessory),
  });

  const availability = watch('availability');

  React.useEffect(() => {
    let cancelled = false;
    if (!accessory) {
      setInitialImagesReady(true);
      return;
    }
    const ids = [accessory.coverImageId, ...accessory.imageIds].filter(
      (id): id is string => Boolean(id),
    );
    const unique = Array.from(new Set(ids));
    (async () => {
      const map = new Map<string, { blob: Blob; filename: string; publicUrl?: string }>();
      for (const id of unique) {
        const stored = await repositories.imageRepository.findById(id);
        if (stored) {
          map.set(id, {
            blob: stored.blob,
            filename: stored.filename,
            publicUrl: stored.publicUrl,
          });
        }
      }
      if (cancelled) return;
      const initial = buildInitialImages(accessory.coverImageId, accessory.imageIds, map);
      setImages(initial);
      setInitialImagesReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [accessory]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const existingIds = new Set(
        [accessory?.coverImageId, ...(accessory?.imageIds ?? [])].filter(
          (id): id is string => Boolean(id),
        ),
      );
      const coverId = images.find((img) => img.isCover)?.existingId ?? null;
      const orderedExistingIds: string[] = [];
      for (const image of images) {
        if (image.existingId && existingIds.has(image.existingId)) {
          orderedExistingIds.push(image.existingId);
        }
      }
      const newImageInputs = images
        .filter((image) => !image.existingId)
        .map((image) => ({ blob: image.blob, filename: image.filename }));

      const nextCover =
        (coverId && existingIds.has(coverId) ? coverId : null) ??
        orderedExistingIds[0] ??
        null;
      const finalImageIds: string[] = [];
      if (nextCover) finalImageIds.push(nextCover);
      for (const id of orderedExistingIds) {
        if (id !== nextCover) finalImageIds.push(id);
      }

      const payload = {
        name: values.name,
        category: values.category,
        quantity: values.quantity,
        price: values.price,
        description: values.description ?? '',
        availability: values.availability,
        costPrice: accessory?.costPrice ?? null,
      };

      if (accessory) {
        const updated = await accessoryService.update(
          accessory.id,
          {
            ...payload,
            coverImageId: nextCover,
            imageIds: finalImageIds,
          },
          newImageInputs,
        );
        onSuccess(updated);
        toast.success(t('toast.accessoryUpdated'));
      } else {
        const created = await accessoryService.create(payload, newImageInputs);
        onSuccess(created);
        toast.success(t('toast.accessoryAdded'));
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('toast.saveFailed', t('nav.accessories').toLowerCase()),
      );
    } finally {
      setSubmitting(false);
    }
  });

  if (!initialImagesReady) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sections.basic')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <TextField
            control={control}
            name="name"
            label={t('form.fields.name')}
            required
            placeholder={t('form.placeholders.name')}
          />
          <SelectField
            control={control}
            name="category"
            label={t('form.fields.category')}
            required
            options={ACCESSORY_CATEGORY_KEYS.map((c) => ({
              value: c,
              label: labels.accessoryCategory(c),
            }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              control={control}
              name="quantity"
              label={t('form.fields.quantity')}
              type="number"
              required
            />
            <TextField
              control={control}
              name="price"
              label={t('form.fields.price')}
              type="number"
              required
            />
          </div>
          <TextAreaField
            control={control}
            name="description"
            label={t('form.fields.description')}
            placeholder={t('form.placeholders.description')}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sections.availability')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div>
              <Label htmlFor="availability">{t('form.fields.availabilitySwitchLabel')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('form.fields.availabilitySwitchHint')}
              </p>
            </div>
            <Switch
              id="availability"
              checked={Boolean(availability)}
              onCheckedChange={(checked) =>
                setValue('availability', checked, { shouldDirty: true })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sections.images')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ImageUploader
            initialImages={images}
            onChange={setImages}
            onError={(msg) => toast.error(msg)}
          />
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {accessory ? t('form.saveAccessory') : t('form.addAccessory')}
        </Button>
      </div>
    </form>
  );
}

function buildDefaults(accessory?: Accessory): AccessoryFormValues {
  return {
    name: accessory?.name ?? '',
    category: accessory?.category ?? 'other',
    quantity: accessory?.quantity ?? 0,
    price: accessory?.price ?? 0,
    description: accessory?.description ?? '',
    availability: accessory?.availability ?? true,
  };
}
