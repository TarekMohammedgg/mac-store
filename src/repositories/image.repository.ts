'use client';

import { getDb } from '@/lib/db';
import { generateId, toIsoString } from '@/lib/utils';
import type { ImageInput, ImageMeta, StoredImage } from '@/models/image';

import type { ImageRepository } from './image-repository.types';

class DexieImageRepository implements ImageRepository {
  async save(input: ImageInput): Promise<StoredImage> {
    const db = getDb();
    const record: StoredImage = {
      id: generateId('img'),
      blob: input.blob,
      filename: input.filename,
      mimeType: input.blob.type || 'application/octet-stream',
      size: input.blob.size,
      createdAt: toIsoString(new Date()),
    };
    await db.images.put(record);
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
    const db = getDb();
    const record = await db.images.get(id);
    return record ?? null;
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.images.delete(id);
  }

  async deleteMany(ids: string[]): Promise<void> {
    const db = getDb();
    await db.images.bulkDelete(ids);
  }

  async toMeta(image: StoredImage): Promise<ImageMeta> {
    return {
      id: image.id,
      filename: image.filename,
      mimeType: image.mimeType,
      size: image.size,
      url: URL.createObjectURL(image.blob),
    };
  }

  async toMetaMany(images: StoredImage[]): Promise<ImageMeta[]> {
    return Promise.all(images.map((image) => this.toMeta(image)));
  }
}

export const imageRepository: ImageRepository = new DexieImageRepository();
