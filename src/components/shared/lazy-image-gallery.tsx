'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

const ImageGalleryInner = dynamic(
  () => import('./image-gallery').then((m) => m.ImageGallery),
  {
    ssr: false,
    loading: () => <Skeleton className="aspect-square w-full rounded-lg" />,
  },
);

interface ImageGalleryProps {
  imageIds: string[];
  alt: string;
}

function ImageGalleryPlaceholder({ imageIds, alt }: ImageGalleryProps) {
  return <ImageGalleryInner imageIds={imageIds} alt={alt} />;
}

export const LazyImageGallery = React.memo(ImageGalleryPlaceholder);
LazyImageGallery.displayName = 'LazyImageGallery';
