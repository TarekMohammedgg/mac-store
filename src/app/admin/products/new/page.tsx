'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { useI18n } from '@/i18n';
import { ProductForm } from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';

export default function NewProductPage() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/admin/products">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('nav.products')}
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.addDevice')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.addDeviceHint')}</p>
      </div>
      <ProductForm
        onSuccess={() => router.push('/admin/products')}
        onCancel={() => router.push('/admin/products')}
      />
    </div>
  );
}
