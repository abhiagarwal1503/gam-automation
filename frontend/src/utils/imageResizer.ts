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
  backgroundFill?: boolean; // Whether background fill is enabled (default true)
  backgroundColor?: string; // e.g. '#000000', '#FFFFFF', or 'transparent'
  rotation?: number; // 0, 90, 180, 270
}

/**
 * Utility to resize an image (file, data URL, or remote URL) to target dimensions
 * using HTML5 Canvas, strictly preserving aspect ratio with proportional contain/fit (zero-stretch)
 * and background fill, directly matching imageresizer.com.
 */
export async function resizeImageToAdSize(
  imageSource: string | File,
  targetWidth: number,
  targetHeight: number,
  options: ResizeOptions = {}
): Promise<ImageResizeResult> {
  const {
    quality = 0.92,
    fitMode = 'contain',
    backgroundFill = true,
    backgroundColor = '#000000',
    rotation = 0
  } = options;

  const isTransparent = backgroundColor === 'transparent';
  // Use PNG automatically if transparency is selected or explicitly requested
  const outputFormat = options.format || (isTransparent ? 'image/png' : 'image/jpeg');

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

        // Fill background
        if (isTransparent) {
          ctx.clearRect(0, 0, targetWidth, targetHeight);
        } else if (backgroundColor) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // High quality bicubic image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const isRotated90or270 = (rotation % 180) !== 0;
        const sourceEffectiveWidth = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
        const sourceEffectiveHeight = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

        let scale = 1;
        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;

        // If backgroundFill is active (default) or fitMode is contain, NEVER STRETCH:
        if (backgroundFill || fitMode === 'contain') {
          scale = Math.min(targetWidth / sourceEffectiveWidth, targetHeight / sourceEffectiveHeight);
          drawWidth = Math.round(sourceEffectiveWidth * scale);
          drawHeight = Math.round(sourceEffectiveHeight * scale);
          offsetX = Math.round((targetWidth - drawWidth) / 2);
          offsetY = Math.round((targetHeight - drawHeight) / 2);
        } else {
          // Only stretch if user explicitly disabled backgroundFill AND set stretch mode
          drawWidth = targetWidth;
          drawHeight = targetHeight;
          scale = Math.min(targetWidth / sourceEffectiveWidth, targetHeight / sourceEffectiveHeight);
        }

        ctx.save();
        if (rotation !== 0) {
          // Move origin to center of bounding box
          ctx.translate(offsetX + drawWidth / 2, offsetY + drawHeight / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          const rawW = isRotated90or270 ? drawHeight : drawWidth;
          const rawH = isRotated90or270 ? drawWidth : drawHeight;
          ctx.drawImage(img, -rawW / 2, -rawH / 2, rawW, rawH);
        } else {
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
        ctx.restore();

        const dataUrl = canvas.toDataURL(outputFormat, quality);
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
          outputFormat,
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

