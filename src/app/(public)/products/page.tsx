import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProductExplorer } from '@/features/products/product-explorer';
import {
  FiltersSkeleton,
  PageHeaderSkeleton,
  ProductGridSkeleton,
} from '@/components/shared/skeletons';

export const metadata: Metadata = {
  title: 'Devices',
  description: 'Browse the full catalog of Apple devices currently in inventory.',
};

function ProductsFallback() {
  return (
    <>
      <PageHeaderSkeleton />
      <FiltersSkeleton />
      <ProductGridSkeleton count={8} />
    </>
  );
}

export default function ProductsPage() {
  return (
    <div className="container-narrow py-10 sm:py-14">
      <Suspense fallback={<ProductsFallback />}>
        <ProductExplorer />
      </Suspense>
    </div>
  );
}
