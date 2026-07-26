'use client';

import * as React from 'react';
import { BadgeDollarSign, Package, PackageSearch, ShoppingCart } from 'lucide-react';

import {
  HorizontalBarChart,
  ShareBars,
  TrendAreaChart,
} from '@/components/admin/analytics-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatDate, formatPrice } from '@/lib/format';
import { analyticsService } from '@/services/analytics.service';

const PERIOD_OPTIONS = [7, 30, 90] as const;

export default function AdminAnalyticsPage() {
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const [periodDays, setPeriodDays] = React.useState<(typeof PERIOD_OPTIONS)[number]>(30);

  const insights = useCachedLiveQuery(
    `admin-analytics-${periodDays}`,
    () => analyticsService.getInsights(periodDays),
    [periodDays],
  );

  if (!insights) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={6} columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('analytics.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('analytics.hint')}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {PERIOD_OPTIONS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setPeriodDays(days)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi
          icon={<BadgeDollarSign className="h-4 w-4" />}
          label={t('analytics.kpi.revenue')}
          value={formatPrice(insights.revenue)}
          hint={t('analytics.kpi.revenueHint')}
        />
        <Kpi
          icon={<ShoppingCart className="h-4 w-4" />}
          label={t('analytics.kpi.unitsSold')}
          value={String(insights.unitsSold)}
          hint={t('analytics.kpi.unitsSoldHint')}
        />
        <Kpi
          icon={<Package className="h-4 w-4" />}
          label={t('analytics.kpi.aov')}
          value={formatPrice(insights.averageOrderValue)}
          hint={t('analytics.kpi.aovHint', insights.unitsSold)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('analytics.charts.revenueTrend')}</CardTitle>
          <CardDescription>{t('analytics.charts.revenueTrendHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendAreaChart points={insights.revenueTrend} emptyLabel={t('analytics.empty')} />
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
                label: item.name,
                value: item.value,
                hint: t('analytics.units', item.secondary ?? 0),
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
                label: labels.productCategory(item.category as never) || item.category,
                share: item.share,
                valueLabel: formatPrice(item.revenue),
              }))}
            />
          </CardContent>
        </Card>
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
                  <TableRow>
                    <TableHead>{t('admin.columns.model')}</TableHead>
                    <TableHead>{t('admin.columns.category')}</TableHead>
                    <TableHead className="text-end">{t('admin.columns.price')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights.slowMovers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {labels.productCategory(item.category as never)}
                      </TableCell>
                      <TableCell className="text-end">{formatPrice(item.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('analytics.charts.recentSales')}</CardTitle>
          <CardDescription>{t('analytics.charts.recentSalesHint')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {insights.recentSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('analytics.empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.columns.item')}</TableHead>
                  <TableHead className="text-end">{t('analytics.columns.qty')}</TableHead>
                  <TableHead className="text-end">{t('analytics.columns.amount')}</TableHead>
                  <TableHead className="text-end">{t('analytics.columns.when')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="font-medium">{sale.itemName}</div>
                      <div className="text-xs text-muted-foreground">
                        {labels.productCategory(sale.category as never)}
                      </div>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{sale.quantity}</TableCell>
                    <TableCell className="text-end tabular-nums font-medium">
                      {formatPrice(sale.revenue)}
                    </TableCell>
                    <TableCell className="text-end text-xs text-muted-foreground">
                      {formatDate(sale.soldAt)}
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
      <CardContent className="space-y-2 p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
