'use client';

import * as React from 'react';
import { Package } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useImage } from '@/hooks/use-image';
import { cn } from '@/lib/utils';

interface ImageThumbProps {
  imageId: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

function ImageThumbImpl({ imageId, alt, className, fallbackClassName }: ImageThumbProps) {
  const { meta, loading } = useImage(imageId);

  if (loading) {
    return <Skeleton className={cn('h-full w-full', className)} />;
  }

  if (!meta) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-muted text-muted-foreground',
          className,
          fallbackClassName,
        )}
        aria-label="No image available"
      >
        <Package className="h-1/3 w-1/3" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={meta.url}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      loading="lazy"
      decoding="async"
    />
  );
}

export const ImageThumb = React.memo(ImageThumbImpl);
ImageThumb.displayName = 'ImageThumb';
