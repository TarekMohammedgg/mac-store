'use client';

import { use } from 'react';

import { ProductDetailView } from '@/components/products/product-detail-view';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = use(params);
  return <ProductDetailView id={id} />;
}
