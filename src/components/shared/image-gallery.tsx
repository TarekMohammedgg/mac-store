'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useImageList } from '@/hooks/use-image-list';
import type { ImageMeta } from '@/models/image';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  imageIds: string[];
  alt: string;
}

export function ImageGallery({ imageIds, alt }: ImageGalleryProps) {
  const { metas, loading } = useImageList(imageIds);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);

  const orderedMetas = React.useMemo<ImageMeta[]>(() => {
    if (metas.length === 0) return [];
    const map = new Map(metas.map((m) => [m.id, m]));
    return imageIds.map((id) => map.get(id)).filter((m): m is ImageMeta => Boolean(m));
  }, [metas, imageIds]);

  React.useEffect(() => {
    if (activeIndex >= orderedMetas.length) setActiveIndex(0);
  }, [activeIndex, orderedMetas.length]);

  const goPrev = React.useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + orderedMetas.length) % orderedMetas.length);
    setZoom(1);
  }, [orderedMetas.length]);

  const goNext = React.useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % orderedMetas.length);
    setZoom(1);
  }, [orderedMetas.length]);

  if (loading && orderedMetas.length === 0) {
    return <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />;
  }

  if (orderedMetas.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <span className="text-sm">No image</span>
      </div>
    );
  }

  const active = orderedMetas[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group relative aspect-square w-full overflow-hidden rounded-lg border bg-muted"
        aria-label="Open image viewer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          View
        </span>
      </button>
      {orderedMetas.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {orderedMetas.map((meta, index) => (
            <button
              key={meta.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'aspect-square overflow-hidden rounded-md border bg-muted',
                index === activeIndex ? 'ring-2 ring-foreground' : 'opacity-80 hover:opacity-100',
              )}
              aria-label={`Show image ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={meta.url} alt={`${alt} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {activeIndex + 1} / {orderedMetas.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                aria-label="Zoom out"
                disabled={zoom <= 1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
                aria-label="Zoom in"
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative flex items-center justify-center bg-black/90 p-4">
            {orderedMetas.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="absolute left-2 z-10 text-white hover:bg-white/10"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            <div className="max-h-[80vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.url}
                alt={alt}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                className="mx-auto max-h-[80vh] w-auto transition-transform"
              />
            </div>
            {orderedMetas.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goNext}
                className="absolute right-2 z-10 text-white hover:bg-white/10"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
