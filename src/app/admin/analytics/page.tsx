'use client';

import * as React from 'react';
import {
  BadgeDollarSign,
  PackageSearch,
  PiggyBank,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import {
  HorizontalBarChart,
  ShareBars,
  TrendAreaChart,
} from '@/components/admin/analytics-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatsCardSkeleton, TableSkeleton } from '@/components/shared/skeletons';
import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPrice } from '@/lib/format';
import type { Sale } from '@/models/analytics';
import { analyticsService } from '@/services/analytics.service';

const PERIOD_OPTIONS = [7, 30, 90] as const;

type SalesSort =
  | 'newest'
  | 'oldest'
  | 'profit-desc'
  | 'profit-asc'
  | 'price-desc'
  | 'price-asc';

function sortSales(sales: Sale[], sortBy: SalesSort): Sale[] {
  const next = [...sales];
  next.sort((a, b) => {
    switch (sortBy) {
      case 'oldest': {
        const byCreated = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (byCreated !== 0) return byCreated;
        return new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime();
      }
      case 'profit-desc':
        return b.profit - a.profit;
      case 'profit-asc':
        return a.profit - b.profit;
      case 'price-desc':
        return b.unitPrice - a.unitPrice;
      case 'price-asc':
        return a.unitPrice - b.unitPrice;
      case 'newest':
      default: {
        const byCreated = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (byCreated !== 0) return byCreated;
        return new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime();
      }
    }
  });
  return next;
}

export default function AdminAnalyticsPage() {
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const [periodDays, setPeriodDays] = React.useState<(typeof PERIOD_OPTIONS)[number]>(30);
  const [salesSort, setSalesSort] = React.useState<SalesSort>('newest');

  const insights = useCachedLiveQuery(
    `admin-analytics-${periodDays}`,
    () => analyticsService.getInsights(periodDays),
    [periodDays],
  );

  const sortedSales = React.useMemo(
    () => (insights ? sortSales(insights.recentSales, salesSort) : []),
    [insights, salesSort],
  );

  if (!insights) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={6} columns={4} />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t('analytics.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('analytics.hint')}</p>
        </div>
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border p-1">
          {PERIOD_OPTIONS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setPeriodDays(days)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                periodDays === days
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('analytics.periodDays', days)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
        <Kpi
          icon={<BadgeDollarSign className="h-4 w-4" />}
          label={t('analytics.kpi.revenue')}
          value={formatPrice(insights.revenue)}
          hint={t('analytics.kpi.revenueHint')}
        />
        <Kpi
          icon={<Wallet className="h-4 w-4" />}
          label={t('analytics.kpi.cost')}
          value={formatPrice(insights.cost)}
          hint={t('analytics.kpi.costHint')}
        />
        <Kpi
          icon={<PiggyBank className="h-4 w-4" />}
          label={t('analytics.kpi.profit')}
          value={formatPrice(insights.profit)}
          hint={t('analytics.kpi.profitHint')}
        />
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label={t('analytics.kpi.margin')}
          value={`${insights.marginPercent}%`}
          hint={t('analytics.kpi.marginHint')}
        />
        <Kpi
          icon={<ShoppingCart className="h-4 w-4" />}
          label={t('analytics.kpi.unitsSold')}
          value={String(insights.unitsSold)}
          hint={t('analytics.kpi.unitsSoldHint')}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('analytics.charts.revenueTrend')}</CardTitle>
          <CardDescription>{t('analytics.charts.revenueTrendHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendAreaChart
            points={insights.revenueTrend}
            emptyLabel={t('analytics.empty')}
            revenueLabel={t('analytics.kpi.revenue')}
            profitLabel={t('analytics.kpi.profit')}
            formatValue={formatPrice}
            unitsLabel={(count) => t('analytics.units', count)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analytics.charts.topRevenue')}</CardTitle>
            <CardDescription>{t('analytics.charts.topRevenueHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              emptyLabel={t('analytics.empty')}
              formatValue={formatPrice}
              items={insights.topByRevenue.map((item) => ({
                id: item.id,
                label: item.name,
                value: item.value,
                hint: `${t('analytics.kpi.profit')} ${formatPrice(item.secondary ?? 0)}`,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analytics.charts.topUnits')}</CardTitle>
            <CardDescription>{t('analytics.charts.topUnitsHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              emptyLabel={t('analytics.empty')}
              formatValue={(value) => t('analytics.units', value)}
              items={insights.topByUnits.map((item) => ({
                id: item.id,
                label: item.name,
                value: item.value,
                hint: formatPrice(item.secondary ?? 0),
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analytics.charts.categoryMix')}</CardTitle>
            <CardDescription>{t('analytics.charts.categoryMixHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ShareBars
              emptyLabel={t('analytics.empty')}
              items={insights.categoryMix.map((item) => ({
                label:
                  labels.productCategory(item.category as never) ||
                  labels.accessoryCategory(item.category as never) ||
                  item.category,
                share: item.share,
                valueLabel: formatPrice(item.revenue),
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analytics.charts.paymentMix')}</CardTitle>
            <CardDescription>{t('analytics.charts.paymentMixHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ShareBars
              emptyLabel={t('analytics.empty')}
              items={insights.paymentMix.map((item) => ({
                label: t(`analytics.payments.${item.method}`),
                share: item.share,
                valueLabel: formatPrice(item.revenue),
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageSearch className="h-4 w-4" />
            {t('analytics.charts.slowMovers')}
          </CardTitle>
          <CardDescription>{t('analytics.charts.slowMoversHint')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {insights.slowMovers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('analytics.charts.slowMoversOk')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-muted/40">{t('admin.columns.model')}</TableHead>
                  <TableHead className="bg-muted/40">{t('admin.columns.category')}</TableHead>
                  <TableHead className="bg-muted/40 text-end">{t('admin.columns.price')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.slowMovers.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {labels.productCategory(item.category as never)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{formatPrice(item.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">{t('analytics.charts.recentSales')}</CardTitle>
            <CardDescription>{t('analytics.charts.recentSalesHint')}</CardDescription>
          </div>
          {insights.recentSales.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {t('analytics.sortBy')}
              </span>
              <Select value={salesSort} onValueChange={(value) => setSalesSort(value as SalesSort)}>
                <SelectTrigger className="h-9 w-full max-w-[11.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="newest">{t('analytics.sort.newest')}</SelectItem>
                  <SelectItem value="oldest">{t('analytics.sort.oldest')}</SelectItem>
                  <SelectItem value="profit-desc">{t('analytics.sort.profitDesc')}</SelectItem>
                  <SelectItem value="profit-asc">{t('analytics.sort.profitAsc')}</SelectItem>
                  <SelectItem value="price-desc">{t('analytics.sort.priceDesc')}</SelectItem>
                  <SelectItem value="price-asc">{t('analytics.sort.priceAsc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="pt-0">
          {sortedSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('analytics.empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-muted/40 min-w-[12rem]">
                    {t('analytics.columns.item')}
                  </TableHead>
                  <TableHead className="bg-muted/40 whitespace-nowrap">
                    {t('analytics.columns.type')}
                  </TableHead>
                  <TableHead className="bg-muted/40 whitespace-nowrap text-end">
                    {t('analytics.columns.qty')}
                  </TableHead>
                  <TableHead className="bg-muted/40 whitespace-nowrap text-end">
                    {t('analytics.columns.listPrice')}
                  </TableHead>
                  <TableHead className="bg-muted/40 whitespace-nowrap text-end">
                    {t('analytics.columns.salePrice')}
                  </TableHead>
                  <TableHead className="bg-muted/40 whitespace-nowrap text-end">
                    {t('analytics.columns.profit')}
                  </TableHead>
                  <TableHead className="bg-muted/40 whitespace-nowrap text-end">
                    {t('analytics.columns.when')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="align-top">
                      <div className="font-medium leading-snug">{sale.itemName}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {sale.itemType === 'product'
                          ? labels.productCategory(sale.category as never)
                          : labels.accessoryCategory(sale.category as never)}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-muted-foreground whitespace-nowrap">
                      {t(`analytics.itemTypes.${sale.itemType}`)}
                    </TableCell>
                    <TableCell className="align-top text-end tabular-nums">{sale.quantity}</TableCell>
                    <TableCell className="align-top text-end tabular-nums whitespace-nowrap">
                      {formatPrice(sale.listPrice)}
                    </TableCell>
                    <TableCell className="align-top text-end tabular-nums font-medium whitespace-nowrap">
                      {formatPrice(sale.unitPrice)}
                    </TableCell>
                    <TableCell className="align-top text-end tabular-nums whitespace-nowrap">
                      {formatPrice(sale.profit)}
                    </TableCell>
                    <TableCell className="align-top text-end text-xs text-muted-foreground whitespace-nowrap">
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
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="min-w-0 leading-snug">{label}</span>
          <span className="shrink-0">{icon}</span>
        </div>
        <div className="break-words text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
          {value}
        </div>
        {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
