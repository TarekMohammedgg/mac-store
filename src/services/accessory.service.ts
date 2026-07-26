import { repositories } from '@/repositories';
import type { Accessory, AccessoryUpdate } from '@/models/accessory';
import type { ImageInput, ImageMeta, StoredImage } from '@/models/image';
import type {
  AccessoryListParams,
  AccessorySearchParams,
} from '@/repositories/accessory-repository.types';

export type AccessoryInput = Omit<Accessory, 'id' | 'createdAt' | 'updatedAt' | 'coverImageId' | 'imageIds'>;

class AccessoryService {
  list(params?: AccessoryListParams) {
    return repositories.accessoryRepository.list(params);
  }

  search(params: AccessorySearchParams) {
    return repositories.accessoryRepository.search(params);
  }

  findById(id: string) {
    return repositories.accessoryRepository.findById(id);
  }

  async create(data: AccessoryInput, images: ImageInput[] = []): Promise<Accessory> {
    const storedImages = await repositories.imageRepository.saveMany(images);
    const imageIds = storedImages.map((img) => img.id);
    const coverImageId = imageIds[0] ?? null;
    return repositories.accessoryRepository.create({
      ...data,
      coverImageId,
      imageIds,
    });
  }

  async update(id: string, data: AccessoryUpdate, newImages: ImageInput[] = []): Promise<Accessory> {
    const existing = await repositories.accessoryRepository.findById(id);
    if (!existing) throw new Error(`Accessory ${id} not found`);

    let imageIds = existing.imageIds;
    let coverImageId = existing.coverImageId;

    if (newImages.length > 0) {
      const stored = await repositories.imageRepository.saveMany(newImages);
      imageIds = [...imageIds, ...stored.map((img) => img.id)];
      if (!coverImageId) {
        coverImageId = imageIds[0] ?? null;
      }
    }

    if (data.coverImageId !== undefined) {
      coverImageId = data.coverImageId;
    }
    if (data.imageIds !== undefined) {
      imageIds = data.imageIds;
    }

    const result = await repositories.accessoryRepository.update(id, {
      ...data,
      coverImageId,
      imageIds,
    });

    if (data.imageIds && data.imageIds.length < existing.imageIds.length) {
      const removed = existing.imageIds.filter((value) => !data.imageIds!.includes(value));
      if (removed.length > 0) {
        await repositories.imageRepository.deleteMany(removed);
      }
    }

    return result;
  }

  async removeImage(accessoryId: string, imageId: string): Promise<Accessory> {
    const existing = await repositories.accessoryRepository.findById(accessoryId);
    if (!existing) throw new Error(`Accessory ${accessoryId} not found`);
    const imageIds = existing.imageIds.filter((id) => id !== imageId);
    const coverImageId =
      existing.coverImageId === imageId ? (imageIds[0] ?? null) : existing.coverImageId;
    await repositories.imageRepository.delete(imageId);
    return repositories.accessoryRepository.update(accessoryId, { imageIds, coverImageId });
  }

  async setCoverImage(accessoryId: string, imageId: string): Promise<Accessory> {
    return repositories.accessoryRepository.update(accessoryId, { coverImageId: imageId });
  }

  async reorderImages(accessoryId: string, imageIds: string[]): Promise<Accessory> {
    return repositories.accessoryRepository.update(accessoryId, { imageIds });
  }

  async delete(id: string): Promise<void> {
    await repositories.accessoryRepository.delete(id);
  }

  duplicate(id: string) {
    return repositories.accessoryRepository.duplicate(id);
  }

  adjustQuantity(id: string, delta: number) {
    return repositories.accessoryRepository.adjustQuantity(id, delta);
  }

  async getImages(accessory: Accessory): Promise<ImageMeta[]> {
    const ids = [accessory.coverImageId, ...accessory.imageIds].filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );
    const uniqueIds = Array.from(new Set(ids));
    const images = await Promise.all(
      uniqueIds.map((id) => repositories.imageRepository.findById(id)),
    );
    const filtered = images.filter((image): image is StoredImage => image !== null);
    return repositories.imageRepository.toMetaMany(filtered);
  }

  countByCategory() {
    return repositories.accessoryRepository.countByCategory();
  }
}

export const accessoryService = new AccessoryService();
