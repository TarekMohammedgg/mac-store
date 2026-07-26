'use client';

import { notifyDataRefresh } from '@/lib/data-refresh';
import { ensureWebpForUpload } from '@/lib/image-webp';
import { supabase } from '@/lib/supabase/client';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { ImageRow } from '@/lib/supabase/mappers';
import {
  deleteProductImage,
  getProductImagePublicUrl,
  uploadProductImageWebp,
} from '@/lib/supabase/storage';
import { generateId, toIsoString } from '@/lib/utils';
import type { ImageInput, ImageMeta, StoredImage } from '@/models/image';

import type { ImageRepository } from './image-repository.types';

function mapImage(row: ImageRow): StoredImage {
  return {
    id: row.id,
    blob: new Blob(),
    filename: row.filename,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
    publicUrl: getProductImagePublicUrl(row.storage_path, row.size ?? row.created_at),
    storagePath: row.storage_path,
  };
}

class SupabaseImageRepository implements ImageRepository {
  async save(input: ImageInput): Promise<StoredImage> {
    const id = generateId('img');
    const webp = await ensureWebpForUpload(input.blob, input.filename);
    const uploaded = await uploadProductImageWebp({
      id,
      blob: webp.blob,
      filename: webp.filename,
    });
    const record: StoredImage = {
      id,
      blob: webp.blob,
      filename: webp.filename,
      mimeType: webp.mimeType,
      size: uploaded.size,
      createdAt: toIsoString(new Date()),
      publicUrl: uploaded.publicUrl,
      storagePath: uploaded.storagePath,
    };
    notifyDataRefresh();
    return record;
  }

  async saveMany(inputs: ImageInput[]): Promise<StoredImage[]> {
    const results: StoredImage[] = [];
    for (const input of inputs) {
      results.push(await this.save(input));
    }
    return results;
  }

  async findById(id: string): Promise<StoredImage | null> {
    const { data, error } = await supabase.from('images').select('*').eq('id', id).maybeSingle();
    throwIfSupabaseError(error);
    return data ? mapImage(data as ImageRow) : null;
  }

  async delete(id: string): Promise<void> {
    await deleteProductImage(id);
    notifyDataRefresh();
  }

  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await deleteProductImage(id);
    }
    notifyDataRefresh();
  }

  async toMeta(image: StoredImage): Promise<ImageMeta> {
    return {
      id: image.id,
      filename: image.filename,
      mimeType: image.mimeType,
      size: image.size,
      url:
        image.publicUrl ??
        (image.storagePath
          ? getProductImagePublicUrl(image.storagePath, image.size)
          : URL.createObjectURL(image.blob)),
    };
  }

  async toMetaMany(images: StoredImage[]): Promise<ImageMeta[]> {
    return Promise.all(images.map((image) => this.toMeta(image)));
  }
}

export const imageRepository: ImageRepository = new SupabaseImageRepository();
