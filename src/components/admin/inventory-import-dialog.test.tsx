/**
 * @vitest-environment jsdom
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { InventoryImportDialog } from '@/components/admin/inventory-import-dialog';
import { I18nProvider } from '@/i18n';

vi.mock('@/services/inventory-import.service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/excel/inventory-import')>(
    '@/lib/excel/inventory-import',
  );
  return {
    inventoryImportService: {
      parseFile: async (_file: File, mode: 'all' | 'products' | 'accessories' = 'all') => {
        const buffer = readFileSync('d:/18-1-2026.xlsx');
        return actual.parseInventoryWorkbook(buffer, mode);
      },
      importParsed: async (preview: { products: unknown[]; accessories: unknown[] }) => ({
        preview,
        importedProducts: preview.products.length,
        importedAccessories: preview.accessories.length,
      }),
    },
  };
});

describe('InventoryImportDialog', () => {
  it('shows Excel-like headers and editable cells from the workbook', async () => {
    render(
      <I18nProvider initialLocale="en">
        <InventoryImportDialog mode="products" />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /import devices/i }));
    expect(await screen.findByText(/import devices from excel/i)).toBeInTheDocument();

    const file = new File([readFileSync('d:/18-1-2026.xlsx')], '18-1-2026.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/devices ready/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /laptop/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Model Info' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Price' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'CPU' })).toBeInTheDocument();
    expect(screen.queryByText(/skipped sheets/i)).not.toBeInTheDocument();

    const modelInput = screen.getAllByDisplayValue(/MacBook Air M2 2022/i)[0] as HTMLInputElement;
    fireEvent.change(modelInput, { target: { value: 'Edited MacBook Air' } });
    expect(screen.getByDisplayValue('Edited MacBook Air')).toBeInTheDocument();
  }, 30_000);
});
