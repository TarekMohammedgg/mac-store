'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PaymentMethod, Sale, SaleItemType } from '@/models/analytics';
import { accessoryService } from '@/services/accessory.service';
import { productService } from '@/services/product.service';
import { salesService } from '@/services/sales.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/shared/skeletons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'transfer', 'other'];

type RecentSortKey = 'item' | 'listPrice' | 'salePrice' | 'profit' | 'when';
type ActiveSort = RecentSortKey | 'recorded';
type SortDir = 'asc' | 'desc';

function sortRecentSales(sales: Sale[], key: ActiveSort, dir: SortDir): Sale[] {
  const next = [...sales];
  const sign = dir === 'asc' ? 1 : -1;
  next.sort((a, b) => {
    switch (key) {
      case 'item':
        return a.itemName.localeCompare(b.itemName, undefined, { sensitivity: 'base' }) * sign;
      case 'listPrice':
        return (a.listPrice - b.listPrice) * sign;
      case 'salePrice':
        return (a.unitPrice - b.unitPrice) * sign;
      case 'profit':
        return (a.profit - b.profit) * sign;
      case 'when':
        return (new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime()) * sign;
      case 'recorded':
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sign;
    }
  });
  return next;
}

function toDateTimeLocalValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export default function AdminSalesPage() {
  const { t } = useI18n();
  const labels = useLocalizedLabels();

  const products = useCachedLiveQuery('admin-sales-products', () => productService.search({}), []);
  const accessories = useCachedLiveQuery(
    'admin-sales-accessories',
    () => accessoryService.search({}),
    [],
  );
  const recentSales = useCachedLiveQuery('admin-sales-recent', () => salesService.listRecent(20), []);

  const [itemType, setItemType] = React.useState<SaleItemType>('product');
  const [itemId, setItemId] = React.useState('');
  const [unitPrice, setUnitPrice] = React.useState('');
  const [quantity, setQuantity] = React.useState('1');
  const [soldAt, setSoldAt] = React.useState(toDateTimeLocalValue);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('cash');
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<ActiveSort>('recorded');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');

  const sortedRecentSales = React.useMemo(
    () => (recentSales ? sortRecentSales(recentSales, sortKey, sortDir) : []),
    [recentSales, sortKey, sortDir],
  );

  const toggleSort = (key: RecentSortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'item' ? 'asc' : 'desc');
  };

  const availableProducts = React.useMemo(
    () => (products ?? []).filter((p) => p.availability === 'available' && p.quantity > 0),
    [products],
  );
  const availableAccessories = React.useMemo(
    () => (accessories ?? []).filter((a) => a.quantity > 0),
    [accessories],
  );

  const selectedProduct = availableProducts.find((p) => p.id === itemId);
  const selectedAccessory = availableAccessories.find((a) => a.id === itemId);
  const listPrice =
    itemType === 'product' ? (selectedProduct?.price ?? null) : (selectedAccessory?.price ?? null);
  const costPrice =
    itemType === 'product'
      ? (selectedProduct?.costPrice ?? 0)
      : (selectedAccessory?.costPrice ?? 0);
  const maxQty =
    itemType === 'product'
      ? (selectedProduct?.quantity ?? 1)
      : (selectedAccessory?.quantity ?? 1);

  React.useEffect(() => {
    setItemId('');
    setQuantity('1');
  }, [itemType]);

  React.useEffect(() => {
    if (listPrice == null) {
      setUnitPrice('');
      return;
    }
    setUnitPrice(String(listPrice));
  }, [itemId, listPrice]);

  React.useEffect(() => {
    setQuantity('1');
  }, [itemId]);

  const qtyNum = Math.min(maxQty, Math.max(1, Number(quantity) || 1));
  const priceNum = Number(unitPrice) || 0;
  const revenuePreview = Math.round(priceNum * qtyNum * 100) / 100;
  const costPreview = Math.round((costPrice ?? 0) * qtyNum * 100) / 100;
  const profitPreview = Math.round((revenuePreview - costPreview) * 100) / 100;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemId) {
      toast.error(t('sales.errors.itemRequired'));
      return;
    }
    if (priceNum < 0) {
      toast.error(t('sales.errors.invalidPrice'));
      return;
    }
    if (qtyNum < 1 || qtyNum > maxQty) {
      toast.error(t('sales.errors.invalidQty'));
      return;
    }

    setSubmitting(true);
    try {
      await salesService.record({
        itemType,
        itemId,
        quantity: qtyNum,
        unitPrice: priceNum,
        soldAt: fromDateTimeLocalValue(soldAt),
        paymentMethod,
        notes: notes.trim(),
      });
      toast.success(t('toast.saleRecorded'));
      setItemId('');
      setNotes('');
      setQuantity('1');
      setSoldAt(toDateTimeLocalValue());
      setPaymentMethod('cash');
      setSortKey('recorded');
      setSortDir('desc');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saleFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const catalogReady = products !== undefined && accessories !== undefined;

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('sales.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('sales.hint')}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              {t('sales.formTitle')}
            </CardTitle>
            <CardDescription>{t('sales.formHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!catalogReady ? (
              <TableSkeleton rows={4} columns={2} />
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label>{t('sales.fields.itemType')}</Label>
                  <Select
                    value={itemType}
                    onValueChange={(value) => setItemType(value as SaleItemType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">{t('sales.itemTypes.product')}</SelectItem>
                      <SelectItem value="accessory">{t('sales.itemTypes.accessory')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('sales.fields.item')}</Label>
                  <Select value={itemId || undefined} onValueChange={setItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('sales.placeholders.item')} />
                    </SelectTrigger>
                    <SelectContent>
                      {itemType === 'product'
                        ? availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.model} · {formatPrice(product.price)} · x
                              {product.quantity}
                            </SelectItem>
                          ))
                        : availableAccessories.map((accessory) => (
                            <SelectItem key={accessory.id} value={accessory.id}>
                              {accessory.name} · {formatPrice(accessory.price)} · x
                              {accessory.quantity}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  {itemType === 'product' && availableProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('sales.emptyProducts')}</p>
                  ) : null}
                  {itemType === 'accessory' && availableAccessories.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('sales.emptyAccessories')}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t('sales.fields.listPrice')}</Label>
                    <Input
                      value={listPrice == null ? '—' : formatPrice(listPrice)}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sale-price">{t('sales.fields.salePrice')}</Label>
                    <Input
                      id="sale-price"
                      type="number"
                      min={0}
                      step="1"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required
                      disabled={!itemId}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sale-qty">{t('sales.fields.quantity')}</Label>
                    <Input
                      id="sale-qty"
                      type="number"
                      min={1}
                      max={maxQty}
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={!itemId}
                      required
                    />
                    {itemId ? (
                      <p className="text-xs text-muted-foreground">
                        {t('sales.availableStock', maxQty)}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sale-when">{t('sales.fields.soldAt')}</Label>
                    <Input
                      id="sale-when"
                      type="datetime-local"
                      value={soldAt}
                      onChange={(e) => setSoldAt(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('sales.fields.paymentMethod')}</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {t(`sales.payments.${method}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sale-notes">{t('sales.fields.notes')}</Label>
                  <Textarea
                    id="sale-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder={t('sales.placeholders.notes')}
                  />
                </div>

                {itemId ? (
                  <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-3">
                    <PreviewStat label={t('sales.preview.revenue')} value={formatPrice(revenuePreview)} />
                    <PreviewStat label={t('sales.preview.cost')} value={formatPrice(costPreview)} />
                    <PreviewStat label={t('sales.preview.profit')} value={formatPrice(profitPreview)} />
                  </div>
                ) : null}

                <Button type="submit" disabled={submitting || !itemId} className="w-full sm:w-auto">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('sales.submit')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('sales.recentTitle')}</CardTitle>
            <CardDescription>{t('sales.recentHint')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {!recentSales ? (
              <TableSkeleton rows={6} columns={5} />
            ) : recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('sales.emptyRecent')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHead
                      active={sortKey === 'item'}
                      dir={sortDir}
                      label={t('sales.columns.item')}
                      onSort={() => toggleSort('item')}
                    />
                    <SortableHead
                      active={sortKey === 'listPrice'}
                      align="end"
                      dir={sortDir}
                      label={t('sales.columns.listPrice')}
                      onSort={() => toggleSort('listPrice')}
                    />
                    <SortableHead
                      active={sortKey === 'salePrice'}
                      align="end"
                      dir={sortDir}
                      label={t('sales.columns.salePrice')}
                      onSort={() => toggleSort('salePrice')}
                    />
                    <SortableHead
                      active={sortKey === 'profit'}
                      align="end"
                      dir={sortDir}
                      label={t('sales.columns.profit')}
                      onSort={() => toggleSort('profit')}
                    />
                    <SortableHead
                      active={sortKey === 'when'}
                      align="end"
                      dir={sortDir}
                      label={t('sales.columns.when')}
                      onSort={() => toggleSort('when')}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="font-medium">{sale.itemName}</div>
                        <div className="text-xs text-muted-foreground">
                          {t(`sales.itemTypes.${sale.itemType}`)} · x{sale.quantity}
                          {sale.itemType === 'product'
                            ? ` · ${labels.productCategory(sale.category as never)}`
                            : ` · ${labels.accessoryCategory(sale.category as never)}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-end tabular-nums whitespace-nowrap">
                        {formatPrice(sale.listPrice)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums font-medium whitespace-nowrap">
                        {formatPrice(sale.unitPrice)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums whitespace-nowrap">
                        {formatPrice(sale.profit)}
                      </TableCell>
                      <TableCell className="text-end text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(sale.soldAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SortableHead({
  label,
  active,
  dir,
  onSort,
  align = 'start',
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onSort: () => void;
  align?: 'start' | 'end';
}) {
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('bg-muted/40 whitespace-nowrap', align === 'end' && 'text-end')}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-sm py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          align === 'end' && 'flex-row-reverse',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <span>{label}</span>
        <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'opacity-100' : 'opacity-40')} />
      </button>
    </TableHead>
  );
}
