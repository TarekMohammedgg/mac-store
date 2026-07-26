import { repositories } from '@/repositories';
import type { ImageInput, ImageMeta, StoredImage } from '@/models/image';
import type { Product, ProductUpdate } from '@/models/product';
import type {
  ProductListParams,
  ProductSearchParams,
} from '@/repositories/product-repository.types';

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'coverImageId' | 'imageIds'>;

class ProductService {
  list(params?: ProductListParams) {
    return repositories.productRepository.list(params);
  }

  search(params: ProductSearchParams) {
    return repositories.productRepository.search(params);
  }

  findById(id: string) {
    return repositories.productRepository.findById(id);
  }

  async create(data: ProductInput, images: ImageInput[] = []): Promise<Product> {
    const storedImages = await repositories.imageRepository.saveMany(images);
    const imageIds = storedImages.map((img) => img.id);
    const coverImageId = imageIds[0] ?? null;
    return repositories.productRepository.create({
      ...data,
      coverImageId,
      imageIds,
    });
  }

  async update(id: string, data: ProductUpdate, newImages: ImageInput[] = []): Promise<Product> {
    const existing = await repositories.productRepository.findById(id);
    if (!existing) throw new Error(`Product ${id} not found`);

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

    const result = await repositories.productRepository.update(id, {
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

  async removeImage(productId: string, imageId: string): Promise<Product> {
    const existing = await repositories.productRepository.findById(productId);
    if (!existing) throw new Error(`Product ${productId} not found`);
    const imageIds = existing.imageIds.filter((id) => id !== imageId);
    const coverImageId = existing.coverImageId === imageId ? (imageIds[0] ?? null) : existing.coverImageId;
    await repositories.imageRepository.delete(imageId);
    return repositories.productRepository.update(productId, { imageIds, coverImageId });
  }

  async setCoverImage(productId: string, imageId: string): Promise<Product> {
    return repositories.productRepository.update(productId, { coverImageId: imageId });
  }

  async reorderImages(productId: string, imageIds: string[]): Promise<Product> {
    return repositories.productRepository.update(productId, { imageIds });
  }

  async delete(id: string): Promise<void> {
    await repositories.productRepository.delete(id);
  }

  duplicate(id: string) {
    return repositories.productRepository.duplicate(id);
  }

  async getImages(product: Product): Promise<ImageMeta[]> {
    const ids = [product.coverImageId, ...product.imageIds].filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );
    const uniqueIds = Array.from(new Set(ids));
    const images = await Promise.all(
      uniqueIds.map((id) => repositories.imageRepository.findById(id)),
    );
    const filtered = images.filter((image): image is StoredImage => image !== null);
    return repositories.imageRepository.toMetaMany(filtered);
  }

  countByAvailability() {
    return repositories.productRepository.countByAvailability();
  }

  countByCategory() {
    return repositories.productRepository.countByCategory();
  }
}

export const productService = new ProductService();
