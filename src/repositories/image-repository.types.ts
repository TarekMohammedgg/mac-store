import type { ImageInput, ImageMeta, StoredImage } from '@/models/image';

export interface ImageRepository {
  save(input: ImageInput): Promise<StoredImage>;
  saveMany(inputs: ImageInput[]): Promise<StoredImage[]>;
  findById(id: string): Promise<StoredImage | null>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
  toMeta(image: StoredImage): Promise<ImageMeta>;
  toMetaMany(images: StoredImage[]): Promise<ImageMeta[]>;
}
