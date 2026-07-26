'use client';

import * as React from 'react';

import { compressImageToWebp } from '@/lib/image-webp';
import { generateId } from '@/lib/utils';

export interface LocalImagePreview {
  localId: string;
  blob: Blob;
  filename: string;
  url: string;
  isCover: boolean;
  existingId: string | null;
}

interface UseLocalImageListResult {
  items: LocalImagePreview[];
  add: (file: File) => Promise<void>;
  remove: (localId: string) => void;
  reorder: (sourceId: string, targetId: string) => void;
  setCover: (localId: string) => void;
  toInputs: () => { blob: Blob; filename: string; existingId: string | null }[];
  reset: (next: LocalImagePreview[]) => void;
}

export function useLocalImageList(
  initial: LocalImagePreview[],
  onChange?: (items: LocalImagePreview[]) => void,
): UseLocalImageListResult {
  const [items, setItems] = React.useState<LocalImagePreview[]>(initial);
  const isFirst = React.useRef(true);

  React.useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    onChange?.(items);
  }, [items, onChange]);

  React.useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = React.useCallback(async (file: File) => {
    const compressed = await compressImageToWebp(file);
    const url = URL.createObjectURL(compressed.blob);
    const localId = generateId('tmp');
    setItems((prev) => {
      const next: LocalImagePreview = {
        localId,
        blob: compressed.blob,
        filename: compressed.filename,
        url,
        isCover: prev.length === 0,
        existingId: null,
      };
      return [...prev, next];
    });
  }, []);

  const remove = React.useCallback((localId: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.localId === localId);
      if (target) URL.revokeObjectURL(target.url);
      const filtered = prev.filter((item) => item.localId !== localId);
      if (filtered.length > 0 && !filtered.some((item) => item.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  }, []);

  const reorder = React.useCallback((sourceId: string, targetId: string) => {
    setItems((prev) => {
      const fromIndex = prev.findIndex((item) => item.localId === sourceId);
      const toIndex = prev.findIndex((item) => item.localId === targetId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const setCover = React.useCallback((localId: string) => {
    setItems((prev) =>
      prev.map((item) => ({ ...item, isCover: item.localId === localId })),
    );
  }, []);

  const reset = React.useCallback((next: LocalImagePreview[]) => {
    setItems(next);
  }, []);

  const toInputs = React.useCallback(
    () =>
      items.map((item) => ({
        blob: item.blob,
        filename: item.filename,
        existingId: item.existingId,
      })),
    [items],
  );

  return { items, add, remove, reorder, setCover, toInputs, reset };
}

export function buildInitialImages(
  coverImageId: string | null,
  imageIds: string[],
  blobs: Map<string, { blob: Blob; filename: string; publicUrl?: string }>,
): LocalImagePreview[] {
  const ordered = [coverImageId, ...imageIds].filter(
    (id): id is string => typeof id === 'string' && id.length > 0,
  );
  const seen = new Set<string>();
  const result: LocalImagePreview[] = [];
  for (const id of ordered) {
    if (seen.has(id)) continue;
    seen.add(id);
    const data = blobs.get(id);
    if (!data) continue;
    const url = data.publicUrl ?? URL.createObjectURL(data.blob);
    result.push({
      localId: generateId('tmp'),
      blob: data.blob,
      filename: data.filename,
      url,
      isCover: id === coverImageId,
      existingId: id,
    });
  }
  if (result.length > 0 && !result.some((item) => item.isCover)) {
    result[0].isCover = true;
  }
  return result;
}
