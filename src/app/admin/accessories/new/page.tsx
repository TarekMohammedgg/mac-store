'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { useI18n } from '@/i18n';
import { AccessoryForm } from '@/components/admin/accessory-form';
import { Button } from '@/components/ui/button';

export default function NewAccessoryPage() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/admin/accessories">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('nav.accessories')}
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.addAccessory')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.addAccessoryHint')}</p>
      </div>
      <AccessoryForm
        onSuccess={() => router.push('/admin/accessories')}
        onCancel={() => router.push('/admin/accessories')}
      />
    </div>
  );
}
