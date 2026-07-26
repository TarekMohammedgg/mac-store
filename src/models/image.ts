export interface StoredImage {
  id: string;
  blob: Blob;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface ImageInput {
  blob: Blob;
  filename: string;
}

export interface ImageMeta {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}
