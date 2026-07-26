'use client';

import { useEffect, useState } from 'react';

import { subscribeDataRefresh } from '@/lib/data-refresh';
import { repositories } from '@/repositories';
import type { ImageMeta } from '@/models/image';

interface UseImageResult {
  meta: ImageMeta | null;
  loading: boolean;
  error: string | null;
}

// Module-level cache: a single URL meta per imageId shared across all consumers.
const urlCache = new Map<string, ImageMeta>();

export function clearImageUrlCache(imageId?: string): void {
  if (imageId) urlCache.delete(imageId);
  else urlCache.clear();
}

if (typeof window !== 'undefined') {
  subscribeDataRefresh(() => clearImageUrlCache());
}

function acquireMeta(imageId: string): Promise<ImageMeta | null> {
  const cached = urlCache.get(imageId);
  if (cached) return Promise.resolve(cached);
  return repositories.imageRepository.findById(imageId).then(async (image) => {
    if (!image) return null;
    const meta = await repositories.imageRepository.toMeta(image);
    urlCache.set(imageId, meta);
    return meta;
  });
}

export function useImage(imageId: string | null | undefined): UseImageResult {
  const [meta, setMeta] = useState<ImageMeta | null>(
    imageId ? (urlCache.get(imageId) ?? null) : null,
  );
  const [loading, setLoading] = useState<boolean>(Boolean(imageId));
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => subscribeDataRefresh(() => setRefreshTick((n) => n + 1)), []);

  useEffect(() => {
    if (!imageId) {
      setMeta(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    acquireMeta(imageId)
      .then((next) => {
        if (cancelled) return;
        setMeta(next);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load image');
        setMeta(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [imageId, refreshTick]);

  return { meta, loading, error };
}
