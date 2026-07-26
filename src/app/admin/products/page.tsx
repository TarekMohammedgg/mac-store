'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/i18n';
import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { ImageThumb } from '@/components/shared/image-thumb';
import { TableSkeleton } from '@/components/shared/skeletons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice } from '@/lib/format';
import { productService } from '@/services/product.service';

export default function AdminProductsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const [query, setQuery] = React.useState('');
  const products = useCachedLiveQuery(
    'admin-products',
    async () => productService.search({}),
    [],
  );

  const handleDelete = async (id: string) => {
    try {
      await productService.delete(id);
      toast.success(t('toast.deviceRemoved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.deleteFailed'));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const copy = await productService.duplicate(id);
      toast.success(t('toast.deviceDuplicated'));
      router.push(`/admin/products/${copy.id}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.duplicateFailed'));
    }
  };

  const filtered = (products ?? []).filter((product) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      product.model.toLowerCase().includes(needle) ||
      product.serialNumber.toLowerCase().includes(needle) ||
      product.cpu.toLowerCase().includes(needle) ||
      labels.productCategory(product.category).toLowerCase().includes(needle)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('nav.products')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.dashboardHint')}</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" /> {t('admin.newDevice')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('admin.search.devicesPlaceholder')}
                className="pl-9 rtl:pl-3 rtl:pr-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {products === undefined ? '…' : `${filtered.length} / ${products.length}`}
            </div>
          </div>
          {products === undefined ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={7} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              {t('admin.empty.noDevices')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16" />
                  <TableHead>{t('admin.columns.model')}</TableHead>
                  <TableHead>{t('admin.columns.category')}</TableHead>
                  <TableHead>{t('admin.columns.condition')}</TableHead>
                  <TableHead>{t('admin.columns.status')}</TableHead>
                  <TableHead className="text-end">{t('admin.columns.price')}</TableHead>
                  <TableHead className="w-32 text-end">{t('admin.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
                        <ImageThumb imageId={product.coverImageId} alt={product.model} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.model}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.cpu} · {product.ram}GB · {product.storage}GB
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {labels.productCategory(product.category)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{labels.condition(product.condition)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.availability === 'available'
                            ? 'success'
                            : product.availability === 'sold'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {labels.availability(product.availability)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label={t('admin.actions.edit')}>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(product.id)}
                          aria-label={t('admin.actions.duplicate')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t('admin.actions.delete')}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t('admin.confirm.deleteDeviceTitle')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('admin.confirm.deleteDeviceDescription', product.model)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)}>
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
