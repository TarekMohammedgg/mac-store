'use client';

import { use } from 'react';

import { AccessoryDetailView } from '@/components/accessories/accessory-detail-view';

interface AccessoryPageProps {
  params: Promise<{ id: string }>;
}

export default function AccessoryDetailPage({ params }: AccessoryPageProps) {
  const { id } = use(params);
  return <AccessoryDetailView id={id} />;
}
