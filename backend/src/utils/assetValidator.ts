import axios from 'axios';
import sizeOf from 'image-size';
import { URL } from 'url';

export interface ImageValidationResult {
  isValid: boolean;
  width?: number;
  height?: number;
  contentType?: string;
  error?: string;
}

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

/**
 * Validates a click/target URL:
 * - Must be a valid URL
 * - Must use http: or https: protocol only
 * - Disallow javascript:, data:, file:, etc.
 */
export function validateTargetUrl(urlStr: string): UrlValidationResult {
  if (!urlStr || typeof urlStr !== 'string') {
    return { isValid: false, error: 'Target URL is required.' };
  }

  const trimmed = urlStr.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: `Unsafe or invalid protocol: '${parsed.protocol}'. Only http:// and https:// URLs are allowed.`
      };
    }
    return { isValid: true, sanitizedUrl: trimmed };
  } catch (err: any) {
    return { isValid: false, error: `Invalid URL format: ${err.message || 'Malformed URL'}` };
  }
}

/**
 * Validates a banner image (URL or data URL):
 * - Validates format
 * - Inspects actual image width and height
 */
export async function validateBannerUrl(
  urlStr: string,
  expectedWidth?: number,
  expectedHeight?: number,
  isDryRun: boolean = false
): Promise<ImageValidationResult> {
  if (!urlStr || typeof urlStr !== 'string') {
    return { isValid: false, error: 'Banner image or URL is required.' };
  }

  // Handle base64 data URL
  if (urlStr.startsWith('data:image/')) {
    try {
      const base64Part = urlStr.split(',')[1];
      const buffer = Buffer.from(base64Part, 'base64');
      const dimensions = sizeOf(buffer);
      if (!dimensions || !dimensions.width || !dimensions.height) {
        return { isValid: false, error: 'Could not detect dimensions of uploaded image.' };
      }
      return {
        isValid: true,
        width: dimensions.width,
        height: dimensions.height,
        contentType: urlStr.split(';')[0].replace('data:', '')
      };
    } catch (e: any) {
      return { isValid: false, error: `Invalid image data: ${e.message}` };
    }
  }

  // If dry run and dummy placeholder URL, allow simulated dimensions
  if (isDryRun && (urlStr.includes('example.com') || urlStr.includes('placeholder.com') || urlStr.includes('dummyimage.com'))) {
    return {
      isValid: true,
      width: expectedWidth || 300,
      height: expectedHeight || 250,
      contentType: 'image/jpeg'
    };
  }

  const urlCheck = validateTargetUrl(urlStr);
  if (!urlCheck.isValid) {
    return { isValid: false, error: `Banner URL error: ${urlCheck.error}` };
  }

  try {
    const response = await axios.get(urlStr, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Google-Ad-Manager-Automator/1.0',
        'Accept': 'image/*, */*'
      },
      maxContentLength: 10 * 1024 * 1024 // 10MB max
    });

    if (response.status < 200 || response.status >= 300) {
      return {
        isValid: false,
        error: `Banner URL returned HTTP status ${response.status}. URL must return 200 OK.`
      };
    }

    const rawContentType = response.headers['content-type'];
    const contentType: string = typeof rawContentType === 'string' ? rawContentType : String(rawContentType || '');
    if (!contentType.toLowerCase().startsWith('image/')) {
      return {
        isValid: false,
        contentType,
        error: `Banner URL did not return an image. Content-Type is '${contentType}'.`
      };
    }

    const buffer = Buffer.from(response.data);
    let dimensions;
    try {
      dimensions = sizeOf(buffer);
    } catch (sizeErr: any) {
      return {
        isValid: false,
        contentType,
        error: `Could not parse image dimensions from Banner URL: ${sizeErr.message}`
      };
    }

    if (!dimensions || !dimensions.width || !dimensions.height) {
      return {
        isValid: false,
        contentType,
        error: 'Unable to detect image dimensions.'
      };
    }

    return {
      isValid: true,
      width: dimensions.width,
      height: dimensions.height,
      contentType
    };
  } catch (err: any) {
    if (isDryRun) {
      return {
        isValid: true,
        width: expectedWidth || 300,
        height: expectedHeight || 250,
        contentType: 'image/png'
      };
    }
    return {
      isValid: false,
      error: `Failed to fetch banner image from URL: ${err.message || 'Network error'}`
    };
  }
}
