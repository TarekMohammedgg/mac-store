'use client';

import { useEffect, useState } from 'react';

import { repositories } from '@/repositories';
import type { ImageMeta } from '@/models/image';

interface UseImageListResult {
  metas: ImageMeta[];
  loading: boolean;
  error: string | null;
}

const urlCache = new Map<string, ImageMeta>();

async function resolveAll(ids: string[]): Promise<ImageMeta[]> {
  const missingIds = ids.filter((id) => !urlCache.has(id));
  if (missingIds.length > 0) {
    const results = await Promise.all(
      missingIds.map((id) => repositories.imageRepository.findById(id)),
    );
    const valid = results.filter(
      (value): value is NonNullable<typeof value> => value !== null,
    );
    const metas = await repositories.imageRepository.toMetaMany(valid);
    for (const meta of metas) {
      urlCache.set(meta.id, meta);
    }
  }
  const ordered: ImageMeta[] = [];
  for (const id of ids) {
    const meta = urlCache.get(id);
    if (meta) ordered.push(meta);
  }
  return ordered;
}

export function useImageList(imageIds: string[]): UseImageListResult {
  const key = imageIds.join('|');
  const [metas, setMetas] = useState<ImageMeta[]>(() => {
    const initial: ImageMeta[] = [];
    for (const id of imageIds) {
      const cached = urlCache.get(id);
      if (cached) initial.push(cached);
    }
    return initial;
  });
  const [loading, setLoading] = useState<boolean>(imageIds.length > 0 && metas.length < imageIds.length);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (imageIds.length === 0) {
      setMetas([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setError(null);
    resolveAll(imageIds)
      .then((resolved) => {
        if (!cancelled) setMetas(resolved);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load images');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { metas, loading, error };
}
