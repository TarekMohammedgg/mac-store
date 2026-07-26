import { accessoryRepository } from './accessory.repository';
import { authRepository } from './auth.repository';
import { imageRepository } from './image.repository';
import { productRepository } from './product.repository';
import { settingsRepository } from './settings.repository';
import type { AccessoryRepository } from './accessory-repository.types';
import type { AuthRepository } from './auth-repository.types';
import type { ImageRepository } from './image-repository.types';
import type { ProductRepository } from './product-repository.types';
import type { SettingsRepository } from './settings-repository.types';

export interface RepositoryRegistry {
  productRepository: ProductRepository;
  accessoryRepository: AccessoryRepository;
  imageRepository: ImageRepository;
  authRepository: AuthRepository;
  settingsRepository: SettingsRepository;
}

export const repositories: RepositoryRegistry = {
  productRepository,
  accessoryRepository,
  imageRepository,
  authRepository,
  settingsRepository,
};

export type {
  AccessoryRepository,
  AuthRepository,
  ImageRepository,
  ProductRepository,
  SettingsRepository,
};
