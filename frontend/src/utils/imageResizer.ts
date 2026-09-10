export interface ImageResizeResult {
  dataUrl: string;
  width: number;
  height: number;
  blob: Blob;
  scale: number;
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
  originalWidth: number;
  originalHeight: number;
  fileSizeKb: number;
}

export interface ResizeOptions {
  format?: 'image/jpeg' | 'image/png';
  quality?: number;
  fitMode?: 'contain' | 'stretch';
  backgroundColor?: string; // e.g. '#FFFFFF' or 'transparent'
}

/**
 * Utility to resize an image (file, data URL, or remote URL) to target dimensions
 * using HTML5 Canvas, strictly preserving aspect ratio with proportional contain/fit (zero-crop).
 */
export async function resizeImageToAdSize(
  imageSource: string | File,
  targetWidth: number,
  targetHeight: number,
  options: ResizeOptions = {}
): Promise<ImageResizeResult> {
  const {
    format = 'image/jpeg',
    quality = 0.92,
    fitMode = 'contain',
    backgroundColor = '#FFFFFF'
  } = options;

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

        // Fill background if specified (and not transparent)
        if (backgroundColor && backgroundColor !== 'transparent') {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else if (format === 'image/jpeg') {
          // JPEG doesn't support transparency, fallback to white
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else {
          ctx.clearRect(0, 0, targetWidth, targetHeight);
        }

        // High quality bicubic image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        let scale = 1;
        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (fitMode === 'stretch') {
          // Stretch to fill canvas completely
          drawWidth = targetWidth;
          drawHeight = targetHeight;
          scale = Math.min(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
        } else {
          // Mandatory CONTAIN / FIT: zero cropping, preserve complete original image
          scale = Math.min(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
          drawWidth = Math.round(img.naturalWidth * scale);
          drawHeight = Math.round(img.naturalHeight * scale);
          offsetX = Math.round((targetWidth - drawWidth) / 2);
          offsetY = Math.round((targetHeight - drawHeight) / 2);
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        const dataUrl = canvas.toDataURL(format, quality);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const fileSizeKb = Math.round((blob.size / 1024) * 10) / 10;
              resolve({
                dataUrl,
                width: targetWidth,
                height: targetHeight,
                blob,
                scale,
                drawWidth,
                drawHeight,
                offsetX,
                offsetY,
                originalWidth: img.naturalWidth,
                originalHeight: img.naturalHeight,
                fileSizeKb
              });
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
    img.onerror = () => reject(new Error('Failed to load image for resizing'));

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

