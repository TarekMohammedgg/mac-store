'use client';

import * as React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/shared/image-uploader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SelectField, TextAreaField, TextField } from '@/components/forms/form-fields';
import { repositories } from '@/repositories';
import { buildInitialImages, type LocalImagePreview } from '@/hooks/use-local-images';
import { fromDateInputValue, toDateInputValue } from '@/lib/utils';
import {
  AVAILABILITY_OPTIONS,
  CONDITIONS,
  PRODUCT_CATEGORIES,
  STORAGE_TYPES,
  type Availability,
  type Condition,
  type ProductCategory,
  type StorageType,
} from '@/lib/constants';
import {
  productFormSchema,
  type ProductFormValues,
} from '@/validation/product.schema';
import { productService } from '@/services/product.service';
import type { Product } from '@/models/product';

const PRODUCT_CATEGORY_KEYS: ProductCategory[] = [...PRODUCT_CATEGORIES];
const CONDITION_KEYS: Condition[] = [...CONDITIONS];
const AVAILABILITY_KEYS: Availability[] = [...AVAILABILITY_OPTIONS];
const STORAGE_TYPE_KEYS: StorageType[] = [...STORAGE_TYPES];

interface ProductFormProps {
  product?: Product;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

const todayInput = toDateInputValue(new Date());

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const [submitting, setSubmitting] = React.useState(false);
  const [images, setImages] = React.useState<LocalImagePreview[]>([]);
  const [initialImagesReady, setInitialImagesReady] = React.useState(!product);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: buildDefaults(product),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'specifications' });

  React.useEffect(() => {
    let cancelled = false;
    if (!product) {
      setInitialImagesReady(true);
      return;
    }
    const ids = [product.coverImageId, ...product.imageIds].filter(
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
      const initial = buildInitialImages(product.coverImageId, product.imageIds, map);
      setImages(initial);
      setInitialImagesReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [product]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const data: ProductFormValues = {
        ...values,
        specifications: values.specifications ?? [],
      };

      const existingIds = new Set(
        [product?.coverImageId, ...(product?.imageIds ?? [])].filter(
          (id): id is string => Boolean(id),
        ),
      );
      const orderedExistingIds: string[] = [];
      const coverId = images.find((img) => img.isCover)?.existingId ?? null;
      for (const image of images) {
        if (image.existingId && existingIds.has(image.existingId)) {
          orderedExistingIds.push(image.existingId);
        }
      }

      const newImageInputs = images
        .filter((image) => !image.existingId)
        .map((image) => ({ blob: image.blob, filename: image.filename }));

      const payload = {
        model: data.model,
        serialNumber: data.serialNumber,
        category: data.category,
        cpu: data.cpu,
        ram: data.ram,
        storage: data.storage,
        storageType: data.storageType,
        batteryHealth: data.batteryHealth ?? null,
        cycleCount: data.cycleCount ?? null,
        condition: data.condition,
        price: data.price,
        description: data.description ?? '',
        specifications: Object.fromEntries(
          (data.specifications ?? []).map((spec) => [spec.key, spec.value]),
        ),
        purchaseDate: data.purchaseDate ? fromDateInputValue(data.purchaseDate) : null,
        inventoryDate: fromDateInputValue(data.inventoryDate),
        internalNotes: data.internalNotes ?? '',
        availability: data.availability,
        costPrice: product?.costPrice ?? null,
      };

      if (product) {
        const nextCover =
          (coverId && existingIds.has(coverId) ? coverId : null) ??
          orderedExistingIds[0] ??
          null;
        const newIds: string[] = [];
        if (nextCover) newIds.push(nextCover);
        for (const id of orderedExistingIds) {
          if (id !== nextCover) newIds.push(id);
        }
        const updated = await productService.update(
          product.id,
          {
            ...payload,
            coverImageId: nextCover,
            imageIds: newIds,
          },
          newImageInputs,
        );
        onSuccess(updated);
        toast.success(t('toast.deviceUpdated'));
      } else {
        const created = await productService.create(payload, newImageInputs);
        onSuccess(created);
        toast.success(t('toast.deviceAdded'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saveFailed', t('nav.devices').toLowerCase()));
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('form.sections.basic')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <TextField
              control={control}
              name="model"
              label={t('form.fields.model')}
              required
              placeholder={t('form.placeholders.model')}
            />
            <TextField
              control={control}
              name="serialNumber"
              label={t('form.fields.serialNumber')}
              required
              placeholder={t('form.placeholders.serialNumber')}
            />
            <SelectField
              control={control}
              name="category"
              label={t('form.fields.category')}
              required
              options={PRODUCT_CATEGORY_KEYS.map((cat) => ({
                value: cat,
                label: labels.productCategory(cat),
              }))}
            />
            <SelectField
              control={control}
              name="condition"
              label={t('form.fields.condition')}
              required
              options={CONDITION_KEYS.map((c) => ({
                value: c,
                label: labels.condition(c),
              }))}
            />
            <SelectField
              control={control}
              name="availability"
              label={t('form.fields.availability')}
              required
              options={AVAILABILITY_KEYS.map((a) => ({
                value: a,
                label: labels.availability(a),
              }))}
            />
            <TextField
              control={control}
              name="price"
              label={t('form.fields.price')}
              required
              type="number"
              placeholder="0"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('form.sections.hardware')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <TextField
              control={control}
              name="cpu"
              label={t('form.fields.cpu')}
              required
              placeholder={t('form.placeholders.cpu')}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                control={control}
                name="ram"
                label={t('form.fields.ram')}
                required
                type="number"
                placeholder={t('form.placeholders.ram')}
              />
              <TextField
                control={control}
                name="storage"
                label={t('form.fields.storage')}
                required
                type="number"
                placeholder={t('form.placeholders.storage')}
              />
            </div>
            <SelectField
              control={control}
              name="storageType"
              label={t('form.fields.storageType')}
              required
              options={STORAGE_TYPE_KEYS.map((s) => ({
                value: s,
                label: labels.storageType(s),
              }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                control={control}
                name="batteryHealth"
                label={t('form.fields.batteryHealth')}
                type="number"
                placeholder={t('form.placeholders.batteryHealth')}
              />
              <TextField
                control={control}
                name="cycleCount"
                label={t('form.fields.cycleCount')}
                type="number"
                placeholder={t('form.placeholders.cycleCount')}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sections.specifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.noActivity')}</p>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`spec-key-${field.id}`} className="sr-only">
                        {t('form.fields.specKey')}
                      </Label>
                      <Input
                        id={`spec-key-${field.id}`}
                        placeholder={t('form.placeholders.specKey')}
                        {...register(`specifications.${index}.key` as const)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`spec-value-${field.id}`} className="sr-only">
                        {t('form.fields.specValue')}
                      </Label>
                      <Input
                        id={`spec-value-${field.id}`}
                        placeholder={t('form.placeholders.specValue')}
                        {...register(`specifications.${index}.value` as const)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label={t('common.remove')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ key: '', value: '' })}
          >
            <Plus className="h-4 w-4" /> {t('form.addSpec')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sections.listing')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <TextAreaField
            control={control}
            name="description"
            label={t('form.fields.description')}
            placeholder={t('form.placeholders.description')}
            rows={4}
          />
          <ImageUploader
            initialImages={images}
            onChange={setImages}
            onError={(msg) => toast.error(msg)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.sections.internal')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              control={control}
              name="purchaseDate"
              label={t('form.fields.purchaseDate')}
              type="date"
            />
            <TextField
              control={control}
              name="inventoryDate"
              label={t('form.fields.inventoryDate')}
              type="date"
              required
            />
          </div>
          <TextAreaField
            control={control}
            name="internalNotes"
            label={t('form.fields.internalNotes')}
            placeholder={t('form.placeholders.internalNotes')}
            rows={3}
          />
        </CardContent>
      </Card>

      {Object.keys(errors).length > 0 && (
        <p className="text-sm text-destructive">{t('form.reviewFields')}</p>
      )}

      <Separator />

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {product ? t('form.saveDevice') : t('form.addDevice')}
        </Button>
      </div>
    </form>
  );
}

function buildDefaults(product?: Product): ProductFormValues {
  return {
    model: product?.model ?? '',
    serialNumber: product?.serialNumber ?? '',
    category: product?.category ?? 'macbook-pro',
    cpu: product?.cpu ?? '',
    ram: product?.ram ?? 16,
    storage: product?.storage ?? 256,
    storageType: product?.storageType ?? 'SSD',
    batteryHealth: product?.batteryHealth ?? undefined,
    cycleCount: product?.cycleCount ?? undefined,
    condition: product?.condition ?? 'excellent',
    price: product?.price ?? 0,
    description: product?.description ?? '',
    specifications: product
      ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
      : [],
    purchaseDate: product?.purchaseDate ? toDateInputValue(product.purchaseDate) : '',
    inventoryDate: product?.inventoryDate
      ? toDateInputValue(product.inventoryDate)
      : todayInput,
    internalNotes: product?.internalNotes ?? '',
    availability: product?.availability ?? 'available',
  };
}
