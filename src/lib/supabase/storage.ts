'use client';

import { supabase } from '@/lib/supabase/client';
import { throwIfSupabaseError } from '@/lib/supabase/errors';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

/** Public Storage URL; pass `version` (e.g. file size) to bust browser/CDN cache. */
export function getProductImagePublicUrl(
  storagePath: string,
  version?: string | number | null,
): string {
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);
  if (version == null || version === '') return data.publicUrl;
  const sep = data.publicUrl.includes('?') ? '&' : '?';
  return `${data.publicUrl}${sep}v=${encodeURIComponent(String(version))}`;
}

export async function uploadProductImageWebp(params: {
  id: string;
  blob: Blob;
  filename: string;
}): Promise<{ storagePath: string; publicUrl: string; size: number }> {
  const storagePath = `${params.id}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, params.blob, {
      contentType: 'image/webp',
      upsert: true,
    });
  throwIfSupabaseError(uploadError);

  const size = params.blob.size;
  const { error: insertError } = await supabase.from('images').upsert({
    id: params.id,
    filename: params.filename.endsWith('.webp')
      ? params.filename
      : `${params.filename.replace(/\.[^.]+$/, '')}.webp`,
    mime_type: 'image/webp',
    size,
    storage_path: storagePath,
  });
  throwIfSupabaseError(insertError);

  return {
    storagePath,
    publicUrl: getProductImagePublicUrl(storagePath, size),
    size,
  };
}

export async function deleteProductImage(id: string): Promise<void> {
  const storagePath = `${id}.webp`;
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
  await supabase.from('images').delete().eq('id', id);
}
