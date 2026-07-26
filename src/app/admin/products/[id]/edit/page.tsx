'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useI18n } from '@/i18n';
import { ProductForm } from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';
import { getDb } from '@/lib/db';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const product = useLiveQuery(async () => (await getDb().products.get(id)) ?? null, [id]);

  if (product === undefined) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">{t('admin.notFound.device')}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/admin/products">{t('admin.notFound.backToProducts')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/admin/products">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('nav.products')}
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.editDevice')}</h1>
        <p className="text-sm text-muted-foreground">{product.model}</p>
      </div>
      <ProductForm
        product={product}
        onSuccess={() => router.push('/admin/products')}
        onCancel={() => router.push('/admin/products')}
      />
    </div>
  );
}
