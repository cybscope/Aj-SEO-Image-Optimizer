export interface ImageMetadata {
  title: string;
  altText: string;
  caption: string;
  fileName: string;
}

export interface OptimizedImage {
  id: string;
  originalFile: File;
  originalPreview: string;
  compressedBlob: Blob | null;
  compressedSize: number;
  originalSize: number;
  status: 'pending' | 'compressing' | 'analyzing' | 'done' | 'error';
  metadata: ImageMetadata;
  currentQuality: number;
}

export interface CompressionConfig {
  quality: number; // 0 to 1
  maxWidth: number;
  outputFormat: string;
}