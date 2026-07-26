import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AccessoryExplorer } from '@/features/accessories/accessory-explorer';
import {
  AccessoryGridSkeleton,
  FiltersSkeleton,
  PageHeaderSkeleton,
} from '@/components/shared/skeletons';

export const metadata: Metadata = {
  title: 'Accessories',
  description: 'Apple accessories in stock: cables, chargers, keyboards and more.',
};

function AccessoriesFallback() {
  return (
    <>
      <PageHeaderSkeleton />
      <FiltersSkeleton />
      <AccessoryGridSkeleton count={8} />
    </>
  );
}

export default function AccessoriesPage() {
  return (
    <div className="container-narrow py-10 sm:py-14">
      <Suspense fallback={<AccessoriesFallback />}>
        <AccessoryExplorer />
      </Suspense>
    </div>
  );
}
