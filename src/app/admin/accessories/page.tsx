'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { Copy, Loader2, Minus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { ImageThumb } from '@/components/shared/image-thumb';
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
import { getDb } from '@/lib/db';
import { formatPrice } from '@/lib/format';
import { accessoryService } from '@/services/accessory.service';

export default function AdminAccessoriesPage() {
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const [query, setQuery] = React.useState('');
  const accessories = useLiveQuery(async () => getDb().accessories.toArray(), []);

  if (accessories === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filtered = accessories.filter((accessory) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      accessory.name.toLowerCase().includes(needle) ||
      accessory.category.toLowerCase().includes(needle) ||
      labels.accessoryCategory(accessory.category).toLowerCase().includes(needle)
    );
  });

  const handleDelete = async (id: string) => {
    try {
      await accessoryService.delete(id);
      toast.success(t('toast.accessoryRemoved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.deleteFailed'));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const copy = await accessoryService.duplicate(id);
      toast.success(t('toast.accessoryDuplicated'));
      window.history.pushState({}, '', `/admin/accessories/${copy.id}/edit`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.duplicateFailed'));
    }
  };

  const adjustStock = async (id: string, delta: number) => {
    try {
      await accessoryService.adjustQuantity(id, delta);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.stockUpdateFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('nav.accessories')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.dashboardHint')}</p>
        </div>
        <Button asChild>
          <Link href="/admin/accessories/new">
            <Plus className="h-4 w-4" /> {t('admin.newAccessory')}
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
                placeholder={t('admin.search.accessoriesPlaceholder')}
                className="pl-9 rtl:pl-3 rtl:pr-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {filtered.length} / {accessories.length}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              {t('admin.empty.noAccessories')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16" />
                  <TableHead>{t('admin.columns.name')}</TableHead>
                  <TableHead>{t('admin.columns.category')}</TableHead>
                  <TableHead>{t('admin.columns.stock')}</TableHead>
                  <TableHead>{t('admin.columns.status')}</TableHead>
                  <TableHead className="text-end">{t('admin.columns.price')}</TableHead>
                  <TableHead className="w-40 text-end">{t('admin.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((accessory) => (
                  <TableRow key={accessory.id}>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
                        <ImageThumb imageId={accessory.coverImageId} alt={accessory.name} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{accessory.name}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {accessory.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {labels.accessoryCategory(accessory.category)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => adjustStock(accessory.id, -1)}
                          aria-label={t('admin.actions.decreaseStock')}
                          disabled={accessory.quantity <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="min-w-8 text-center text-sm font-medium">
                          {accessory.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => adjustStock(accessory.id, 1)}
                          aria-label={t('admin.actions.increaseStock')}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={accessory.availability && accessory.quantity > 0 ? 'success' : 'destructive'}
                      >
                        {accessory.availability && accessory.quantity > 0
                          ? t('accessory.inStock')
                          : t('accessory.outOfStock')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">{formatPrice(accessory.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label={t('admin.actions.edit')}>
                          <Link href={`/admin/accessories/${accessory.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(accessory.id)}
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
                                {t('admin.confirm.deleteAccessoryTitle')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('admin.confirm.deleteAccessoryDescription', accessory.name)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(accessory.id)}>
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
