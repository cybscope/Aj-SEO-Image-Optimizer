import { CompressionConfig } from '../types.ts';

/**
 * Compresses an image file using the browser's Canvas API.
 * This runs entirely client-side without a backend.
 */
export const compressImage = async (
  file: File,
  config: CompressionConfig = { quality: 0.7, maxWidth: 1920, outputFormat: 'image/jpeg' }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = (e) => reject(e);

    img.onload = () => {
      // 1. Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > config.maxWidth) {
        height = Math.round((height * config.maxWidth) / width);
        width = config.maxWidth;
      }

      // 2. Create a canvas to draw the resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // 3. Draw image onto canvas
      ctx.drawImage(img, 0, 0, width, height);

      // 4. Export blob with reduced quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        config.outputFormat,
        config.quality
      );
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Formats bytes into human-readable strings (KB, MB)
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Converts a normal string title into an SEO-friendly filename.
 * Example: "My Dog Jumping" -> "my-dog-jumping"
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
};