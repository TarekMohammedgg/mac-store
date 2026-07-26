'use client';

import * as React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { Boxes, DollarSign, Package, Plug, TrendingUp } from 'lucide-react';

import { useI18n } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/use-localized-labels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDb } from '@/lib/db';
import { formatPrice, formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const labels = useLocalizedLabels();
  const stats = useLiveQuery(async () => {
    const db = getDb();
    const products = await db.products.toArray();
    const accessories = await db.accessories.toArray();

    const totalProducts = products.length;
    const availableProducts = products.filter((p) => p.availability === 'available').length;
    const soldProducts = products.filter((p) => p.availability === 'sold').length;
    const inventoryValue = products
      .filter((p) => p.availability === 'available')
      .reduce((acc, p) => acc + p.price, 0);
    const totalAccessories = accessories.length;
    const accessoryUnits = accessories.reduce((acc, a) => acc + a.quantity, 0);
    const accessoryValue = accessories.reduce((acc, a) => acc + a.price * a.quantity, 0);

    return {
      totalProducts,
      availableProducts,
      soldProducts,
      inventoryValue,
      totalAccessories,
      accessoryUnits,
      accessoryValue,
    };
  }, []);

  const recentProducts = useLiveQuery(async () => {
    const db = getDb();
    const products = await db.products.toArray();
    return products
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, []);

  const recentAccessories = useLiveQuery(async () => {
    const db = getDb();
    const accessories = await db.accessories.toArray();
    return accessories
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, []);

  if (!stats) {
    return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.dashboardTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.dashboardHint')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label={t('admin.stats.totalDevices')}
          value={String(stats.totalProducts)}
          hint={t('admin.stats.devicesHint', stats.availableProducts, stats.soldProducts)}
        />
        <StatCard
          icon={<Plug className="h-4 w-4" />}
          label={t('admin.stats.totalAccessories')}
          value={String(stats.totalAccessories)}
          hint={t('admin.stats.accessoriesHint', stats.accessoryUnits)}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label={t('admin.stats.deviceValue')}
          value={formatPrice(stats.inventoryValue)}
          hint={t('admin.stats.deviceValueHint')}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t('admin.stats.accessoryValue')}
          value={formatPrice(stats.accessoryValue)}
          hint={t('admin.stats.accessoryValueHint')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Boxes className="h-4 w-4" /> {t('admin.recentDevices')}
              </span>
              <Link
                href="/admin/products"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t('home.viewAll')}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentProducts && recentProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.columns.model')}</TableHead>
                    <TableHead>{t('admin.columns.category')}</TableHead>
                    <TableHead>{t('admin.columns.condition')}</TableHead>
                    <TableHead className="text-end">{t('admin.columns.price')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.model}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {labels.productCategory(p.category)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{labels.condition(p.condition)}</Badge>
                      </TableCell>
                      <TableCell className="text-end">{formatPrice(p.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">{t('home.empty.noDevices')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Plug className="h-4 w-4" /> {t('admin.recentAccessories')}
              </span>
              <Link
                href="/admin/accessories"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t('home.viewAll')}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentAccessories && recentAccessories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.columns.name')}</TableHead>
                    <TableHead>{t('admin.columns.category')}</TableHead>
                    <TableHead className="text-end">{t('admin.columns.stock')}</TableHead>
                    <TableHead className="text-end">{t('admin.columns.price')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAccessories.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {labels.accessoryCategory(a.category)}
                      </TableCell>
                      <TableCell className="text-end">{a.quantity}</TableCell>
                      <TableCell className="text-end">{formatPrice(a.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">{t('home.empty.noAccessories')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentProducts && recentProducts.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {recentProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-foreground" />
                    <div>
                      <div className="font-medium">{p.model}</div>
                      <div className="text-xs text-muted-foreground">
                        {labels.productCategory(p.category)} · {labels.availability(p.availability)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t('admin.noActivity')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
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
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
