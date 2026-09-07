import { validateTargetUrl, validateBannerUrl } from '../src/utils/assetValidator';

describe('Asset and URL Validators', () => {
  test('validateTargetUrl accepts valid http and https URLs', () => {
    expect(validateTargetUrl('https://example.com/product').isValid).toBe(true);
    expect(validateTargetUrl('http://mysite.org/landing').isValid).toBe(true);
  });

  test('validateTargetUrl rejects unsafe protocols', () => {
    expect(validateTargetUrl('javascript:alert(1)').isValid).toBe(false);
    expect(validateTargetUrl('data:text/html;base64,PHNjcmlwdD4=').isValid).toBe(false);
    expect(validateTargetUrl('file:///etc/passwd').isValid).toBe(false);
  });

  test('validateBannerUrl in dry-run mode passes standard placeholder URLs', async () => {
    const result = await validateBannerUrl('https://example.com/banner.jpg', 300, 250, true);
    expect(result.isValid).toBe(true);
    expect(result.width).toBe(300);
    expect(result.height).toBe(250);
  });
});
