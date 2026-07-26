'use client';

import * as React from 'react';
import { GripVertical, Star, Trash2, Upload } from 'lucide-react';

import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { LocalImagePreview, useLocalImageList } from '@/hooks/use-local-images';

interface ImageUploaderProps {
  initialImages: LocalImagePreview[];
  onChange: (images: LocalImagePreview[]) => void;
  maxImages?: number;
  onError?: (message: string) => void;
}

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 8 * 1024 * 1024;

export function ImageUploader({
  initialImages,
  onChange,
  maxImages = 12,
  onError,
}: ImageUploaderProps) {
  const { t } = useI18n();
  const { items, add, remove, reorder, setCover } = useLocalImageList(initialImages, onChange);
  const [dragging, setDragging] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, maxImages - items.length);

  const handleFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;
      if (items.length + incoming.length > maxImages) {
        onError?.(t('form.upload.errorLimit', maxImages));
        return;
      }
      for (const file of incoming) {
        if (!ACCEPTED_MIME.includes(file.type)) {
          onError?.(t('form.upload.errorFormat', file.name));
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          onError?.(t('form.upload.errorSize', file.name));
          continue;
        }
        await add(file);
      }
    },
    [add, items.length, maxImages, onError, t],
  );

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragging(false);
      if (event.dataTransfer.files.length > 0) {
        void handleFiles(event.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const onDragStart = (id: string) => setDraggingId(id);
  const onDragOverItem = (event: React.DragEvent, id: string) => {
    event.preventDefault();
    if (draggingId && draggingId !== id) {
      reorder(draggingId, id);
      setDraggingId(id);
    }
  };
  const onDragEnd = () => setDraggingId(null);

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <li
              key={item.localId}
              draggable
              onDragStart={() => onDragStart(item.localId)}
              onDragOver={(e) => onDragOverItem(e, item.localId)}
              onDragEnd={onDragEnd}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-lg border bg-muted',
                draggingId === item.localId && 'opacity-60',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.filename}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex items-center gap-1 text-[10px] text-white">
                  <GripVertical className="h-3 w-3" /> #{index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCover(item.localId)}
                    className={cn(
                      'rounded p-1 transition-colors',
                      item.isCover
                        ? 'bg-white text-foreground'
                        : 'text-white/80 hover:bg-white/20 hover:text-white',
                    )}
                    aria-label={item.isCover ? t('form.cover') : t('form.cover')}
                  >
                    <Star className="h-3.5 w-3.5" fill={item.isCover ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.localId)}
                    className="rounded p-1 text-white/80 hover:bg-white/20 hover:text-white"
                    aria-label={t('common.remove')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {item.isCover && (
                <span className="absolute left-2 top-2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
                  {t('form.cover')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {remaining > 0 && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm transition-colors',
            dragging ? 'border-foreground bg-muted' : 'hover:border-foreground/40',
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div className="font-medium">{t('form.upload.prompt')}</div>
          <div className="text-xs text-muted-foreground">{t('form.upload.hint', remaining)}</div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIME.join(',')}
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) {
                void handleFiles(event.target.files);
                event.target.value = '';
              }
            }}
          />
        </label>
      )}
      {items.length > 1 && (
        <p className="text-xs text-muted-foreground">{t('form.upload.dragToReorder')}</p>
      )}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={remaining === 0}
        >
          <Upload className="h-4 w-4" /> {t('form.upload.addImages')}
        </Button>
      </div>
    </div>
  );
}
