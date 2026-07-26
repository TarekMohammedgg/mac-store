'use client';

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.82;

function extensionToWebp(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  return `${base || 'image'}.webp`;
}

function loadImageElement(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image for WebP conversion.'));
    };
    image.src = url;
  });
}

/**
 * Compresses and converts an uploaded image to WebP for storage/upload.
 */
export async function compressImageToWebp(
  file: File | Blob,
  options?: { maxEdge?: number; quality?: number; filename?: string },
): Promise<{ blob: Blob; filename: string; mimeType: 'image/webp' }> {
  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options?.quality ?? DEFAULT_QUALITY;
  const sourceName =
    options?.filename ?? (file instanceof File ? file.name : 'image.webp');

  const image = await loadImageElement(file);
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available for WebP conversion.');
  }
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('WebP encoding failed.'));
          return;
        }
        resolve(result);
      },
      'image/webp',
      quality,
    );
  });

  return {
    blob,
    filename: extensionToWebp(sourceName),
    mimeType: 'image/webp',
  };
}
