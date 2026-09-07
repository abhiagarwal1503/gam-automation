/**
 * Utility to resize an image (file, data URL, or remote URL) to target dimensions
 * using HTML5 Canvas, preserving aspect ratio with cover or letterbox/fit.
 */
export async function resizeImageToAdSize(
  imageSource: string | File,
  targetWidth: number,
  targetHeight: number,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.92
): Promise<{ dataUrl: string; width: number; height: number; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Fill background with clean white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // High quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Compute aspect ratio crop
        const srcRatio = img.naturalWidth / img.naturalHeight;
        const targetRatio = targetWidth / targetHeight;

        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (srcRatio > targetRatio) {
          // Source is wider -> match height, center crop width
          drawHeight = targetHeight;
          drawWidth = targetHeight * srcRatio;
          offsetX = (targetWidth - drawWidth) / 2;
        } else {
          // Source is taller -> match width, center crop height
          drawWidth = targetWidth;
          drawHeight = targetWidth / srcRatio;
          offsetY = (targetHeight - drawHeight) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        const dataUrl = canvas.toDataURL(format, quality);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, width: targetWidth, height: targetHeight, blob });
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          format,
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onload = handleLoad;
    img.onerror = (err) => reject(new Error('Failed to load image for resizing'));

    if (imageSource instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(new Error('Failed to read file: ' + e));
      reader.readAsDataURL(imageSource);
    } else {
      img.src = imageSource;
    }
  });
}
