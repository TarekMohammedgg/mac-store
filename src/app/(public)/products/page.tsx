import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProductExplorer } from '@/features/products/product-explorer';

export const metadata: Metadata = {
  title: 'Devices',
  description: 'Browse the full catalog of Apple devices currently in inventory.',
};

export default function ProductsPage() {
  return (
    <div className="container-narrow py-10 sm:py-14">
      <Suspense fallback={null}>
        <ProductExplorer />
      </Suspense>
    </div>
  );
}
