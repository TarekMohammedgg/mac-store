'use client';

import * as React from 'react';
import { FileSpreadsheet, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  ExcelPreviewSheet,
  ImportMode,
  ParsedInventoryImport,
} from '@/lib/excel/inventory-import';
import { materializeImportFromPreviewSheets } from '@/lib/excel/inventory-import';
import { cn } from '@/lib/utils';
import { inventoryImportService } from '@/services/inventory-import.service';

interface InventoryImportDialogProps {
  mode?: ImportMode;
  onImported?: () => void;
}

type DraftRow = {
  sourceRow: number;
  cells: string[];
  draftId: string;
  included: boolean;
};

type DraftSheet = {
  sheet: string;
  kind: 'products' | 'accessories';
  headers: string[];
  rows: DraftRow[];
};

function toDraftSheets(sheets: ExcelPreviewSheet[]): DraftSheet[] {
  return sheets.map((sheet) => ({
    sheet: sheet.sheet,
    kind: sheet.kind,
    headers: sheet.headers,
    rows: sheet.rows.map((row, index) => ({
      sourceRow: row.sourceRow,
      cells: [...row.cells],
      draftId: `${sheet.sheet}-${row.sourceRow}-${index}`,
      included: true,
    })),
  }));
}

export function InventoryImportDialog({
  mode = 'all',
  onImported,
}: InventoryImportDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [parsing, setParsing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [preview, setPreview] = React.useState<ParsedInventoryImport | null>(null);
  const [sheets, setSheets] = React.useState<DraftSheet[]>([]);
  const [activeSheet, setActiveSheet] = React.useState<string>('');
  const [fileName, setFileName] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const copy = React.useMemo(() => {
    if (mode === 'accessories') {
      return {
        title: t('admin.import.accessoriesTitle'),
        description: t('admin.import.accessoriesDescription'),
        expected: t('admin.import.accessoriesExpectedFormat'),
        button: t('admin.import.accessoriesButton'),
      };
    }
    if (mode === 'products') {
      return {
        title: t('admin.import.productsTitle'),
        description: t('admin.import.productsDescription'),
        expected: t('admin.import.expectedFormat'),
        button: t('admin.import.productsButton'),
      };
    }
    return {
      title: t('admin.import.title'),
      description: t('admin.import.description'),
      expected: t('admin.import.expectedFormat'),
      button: t('admin.importExcel'),
    };
  }, [mode, t]);

  const reset = () => {
    setPreview(null);
    setSheets([]);
    setActiveSheet('');
    setFileName(null);
    setParsing(false);
    setImporting(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await inventoryImportService.parseFile(file, mode);
      const drafts = toDraftSheets(parsed.previewSheets);
      setPreview(parsed);
      setSheets(drafts);
      setActiveSheet(drafts[0]?.sheet ?? '');
      if (drafts.every((sheet) => sheet.rows.length === 0)) {
        toast.error(t('admin.import.noRows'));
      }
    } catch (error) {
      setPreview(null);
      setSheets([]);
      setActiveSheet('');
      toast.error(error instanceof Error ? error.message : t('toast.importFailed'));
    } finally {
      setParsing(false);
    }
  };

  const updateCell = (sheetName: string, draftId: string, cellIndex: number, value: string) => {
    setSheets((current) =>
      current.map((sheet) => {
        if (sheet.sheet !== sheetName) return sheet;
        return {
          ...sheet,
          rows: sheet.rows.map((row) => {
            if (row.draftId !== draftId) return row;
            const cells = [...row.cells];
            cells[cellIndex] = value;
            return { ...row, cells };
          }),
        };
      }),
    );
  };

  const toggleRow = (sheetName: string, draftId: string, included: boolean) => {
    setSheets((current) =>
      current.map((sheet) => {
        if (sheet.sheet !== sheetName) return sheet;
        return {
          ...sheet,
          rows: sheet.rows.map((row) =>
            row.draftId === draftId ? { ...row, included } : row,
          ),
        };
      }),
    );
  };

  const removeRow = (sheetName: string, draftId: string) => {
    setSheets((current) =>
      current.map((sheet) => {
        if (sheet.sheet !== sheetName) return sheet;
        return {
          ...sheet,
          rows: sheet.rows.filter((row) => row.draftId !== draftId),
        };
      }),
    );
  };

  const includedCount = sheets.reduce(
    (sum, sheet) => sum + sheet.rows.filter((row) => row.included).length,
    0,
  );

  const handleImport = async () => {
    if (!preview || includedCount === 0) return;
    setImporting(true);
    try {
      const acceptedSheets: ExcelPreviewSheet[] = sheets
        .map((sheet) => ({
          sheet: sheet.sheet,
          kind: sheet.kind,
          headers: sheet.headers,
          rows: sheet.rows
            .filter((row) => row.included)
            .map(({ sourceRow, cells }) => ({ sourceRow, cells })),
        }))
        .filter((sheet) => sheet.rows.length > 0);

      const materialized = materializeImportFromPreviewSheets(acceptedSheets);
      if (materialized.errors.length > 0 && materialized.products.length === 0 && materialized.accessories.length === 0) {
        toast.error(materialized.errors[0]?.message ?? t('toast.importFailed'));
        return;
      }

      const scoped: ParsedInventoryImport = {
        ...preview,
        products: mode === 'accessories' ? [] : materialized.products,
        accessories: mode === 'products' ? [] : materialized.accessories,
        errors: materialized.errors,
        previewSheets: acceptedSheets,
      };

      const result = await inventoryImportService.importParsed(scoped);
      toast.success(
        t('toast.importSuccess', result.importedProducts, result.importedAccessories),
      );
      onImported?.();
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Upload className="h-4 w-4" /> {copy.button}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] max-w-6xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <p className="text-xs text-muted-foreground">{copy.expected}</p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={parsing || importing}
            onClick={() => inputRef.current?.click()}
          >
            {parsing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {fileName ?? t('admin.import.selectFile')}
          </Button>

          {sheets.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
                <p className="text-sm font-medium tracking-tight">
                  {mode === 'accessories'
                    ? t('admin.import.previewAccessories', includedCount)
                    : t('admin.import.previewDevices', includedCount)}
                </p>
                <p className="text-xs text-muted-foreground">{t('admin.import.tableHint')}</p>
              </div>

              <Tabs
                value={activeSheet || sheets[0]?.sheet}
                onValueChange={setActiveSheet}
                className="space-y-3"
              >
                <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
                  {sheets.map((sheet) => (
                    <TabsTrigger
                      key={sheet.sheet}
                      value={sheet.sheet}
                      className="rounded-md border bg-muted/40 px-3 py-1.5 data-[state=active]:border-foreground/20 data-[state=active]:bg-background"
                    >
                      {sheet.sheet}
                      <span className="ms-1.5 text-muted-foreground">
                        ({sheet.rows.filter((row) => row.included).length})
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {sheets.map((sheet) => (
                  <TabsContent key={sheet.sheet} value={sheet.sheet} className="mt-0 space-y-2">
                    <div className="overflow-hidden rounded-md border">
                      <Table className="min-w-max text-xs">
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="sticky start-0 z-20 w-10 bg-muted/80 backdrop-blur">
                              <span className="sr-only">{t('admin.import.includeRow')}</span>
                            </TableHead>
                            <TableHead className="w-12 bg-muted/60">#</TableHead>
                            {sheet.headers.map((header) => (
                              <TableHead
                                key={`${sheet.sheet}-${header}`}
                                className="min-w-[8.5rem] whitespace-nowrap bg-muted/60 font-semibold normal-case tracking-normal text-foreground"
                              >
                                {header}
                              </TableHead>
                            ))}
                            <TableHead className="sticky end-0 z-20 w-10 bg-muted/80 backdrop-blur">
                              <span className="sr-only">{t('common.remove')}</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sheet.rows.map((row, rowIndex) => (
                            <TableRow
                              key={row.draftId}
                              className={cn(!row.included && 'opacity-45')}
                            >
                              <TableCell className="sticky start-0 z-10 bg-background p-1.5">
                                <input
                                  type="checkbox"
                                  checked={row.included}
                                  onChange={(event) =>
                                    toggleRow(sheet.sheet, row.draftId, event.target.checked)
                                  }
                                  aria-label={t('admin.import.includeRow')}
                                />
                              </TableCell>
                              <TableCell className="p-1.5 text-muted-foreground tabular-nums">
                                {rowIndex + 1}
                              </TableCell>
                              {sheet.headers.map((header, cellIndex) => (
                                <TableCell key={`${row.draftId}-${header}`} className="p-1">
                                  <Input
                                    value={row.cells[cellIndex] ?? ''}
                                    onChange={(event) =>
                                      updateCell(
                                        sheet.sheet,
                                        row.draftId,
                                        cellIndex,
                                        event.target.value,
                                      )
                                    }
                                    className="h-8 min-w-[8rem] rounded-sm border-border/70 bg-background px-2 text-xs shadow-none"
                                  />
                                </TableCell>
                              ))}
                              <TableCell className="sticky end-0 z-10 bg-background p-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeRow(sheet.sheet, row.draftId)}
                                  aria-label={t('common.remove')}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={importing}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || includedCount === 0}
          >
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            {importing ? t('admin.import.importing') : t('admin.import.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
