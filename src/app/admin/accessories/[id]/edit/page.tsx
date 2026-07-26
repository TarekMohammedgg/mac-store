'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useI18n } from '@/i18n';
import { AccessoryForm } from '@/components/admin/accessory-form';
import { Button } from '@/components/ui/button';
import { useCachedLiveQuery } from '@/hooks/use-cached-live-query';
import { accessoryService } from '@/services/accessory.service';

interface EditAccessoryPageProps {
  params: Promise<{ id: string }>;
}

export default function EditAccessoryPage({ params }: EditAccessoryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const accessory = useCachedLiveQuery(
    `admin-edit-accessory-${id}`,
    async () => accessoryService.findById(id),
    [id],
  );

  if (accessory === undefined) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (accessory === null) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">{t('admin.notFound.accessory')}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/admin/accessories">{t('admin.notFound.backToAccessories')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/admin/accessories">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('nav.accessories')}
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.editAccessory')}</h1>
        <p className="text-sm text-muted-foreground">{accessory.name}</p>
      </div>
      <AccessoryForm
        accessory={accessory}
        onSuccess={() => router.push('/admin/accessories')}
        onCancel={() => router.push('/admin/accessories')}
      />
    </div>
  );
}
