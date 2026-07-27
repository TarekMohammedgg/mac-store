import {
  parseInventoryWorkbook,
  type ImportMode,
  type ParsedInventoryImport,
} from '@/lib/excel/inventory-import';
import { repositories } from '@/repositories';

export type InventoryImportResult = {
  preview: ParsedInventoryImport;
  importedProducts: number;
  importedAccessories: number;
};

class InventoryImportService {
  async parseFile(file: File, mode: ImportMode = 'all'): Promise<ParsedInventoryImport> {
    const buffer = await file.arrayBuffer();
    return parseInventoryWorkbook(buffer, mode);
  }

  async importParsed(preview: ParsedInventoryImport): Promise<InventoryImportResult> {
    const CHUNK = 40;
    let importedProducts = 0;
    let importedAccessories = 0;

    for (let i = 0; i < preview.products.length; i += CHUNK) {
      const chunk = preview.products.slice(i, i + CHUNK);
      const created = await repositories.productRepository.createMany(chunk);
      importedProducts += created.length;
    }

    for (let i = 0; i < preview.accessories.length; i += CHUNK) {
      const chunk = preview.accessories.slice(i, i + CHUNK);
      const created = await repositories.accessoryRepository.createMany(chunk);
      importedAccessories += created.length;
    }

    return {
      preview,
      importedProducts,
      importedAccessories,
    };
  }

  async importFile(file: File, mode: ImportMode = 'all'): Promise<InventoryImportResult> {
    const preview = await this.parseFile(file, mode);
    return this.importParsed(preview);
  }
}

export const inventoryImportService = new InventoryImportService();
