import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AccessoryExplorer } from '@/features/accessories/accessory-explorer';

export const metadata: Metadata = {
  title: 'Accessories',
  description: 'Apple accessories in stock: cables, chargers, keyboards and more.',
};

export default function AccessoriesPage() {
  return (
    <div className="container-narrow py-10 sm:py-14">
      <Suspense fallback={null}>
        <AccessoryExplorer />
      </Suspense>
    </div>
  );
}
