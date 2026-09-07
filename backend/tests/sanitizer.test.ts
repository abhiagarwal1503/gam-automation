import {
  sanitizeName,
  formatDateForName,
  generateAdUnitCode,
  generateOrderName,
  generateLineItemName,
  generateCreativeName
} from '../src/utils/sanitizer';

describe('Sanitizer and Naming Utilities', () => {
  test('sanitizeName sanitizes uppercase, spaces, and special characters', () => {
    expect(sanitizeName('ABC Company Homepage')).toBe('abc_company_homepage');
    expect(sanitizeName('  Brand-New 100% Promo!  ')).toBe('brand_new_100_promo');
    expect(sanitizeName('Test__Multiple___Underscores')).toBe('test_multiple_underscores');
  });

  test('formatDateForName formats dates correctly', () => {
    const formatted = formatDateForName('2026-08-20');
    expect(formatted).toMatch(/2026_08_\d{2}/);
  });

  test('generateAdUnitCode matches convention', () => {
    const code = generateAdUnitCode('newstrack', 'homepage', 300, 250);
    expect(code).toBe('newstrack_homepage_300x250');
  });

  test('generateOrderName matches convention', () => {
    const name = generateOrderName('ABC Company', '2026-08-20');
    expect(name).toBe('abc_company_2026_08_20');
  });

  test('generateLineItemName matches convention', () => {
    const name = generateLineItemName('ABC Company', 'homepage', 300, 250);
    expect(name).toBe('abc_company_homepage_300x250');
  });

  test('generateCreativeName matches convention', () => {
    const name = generateCreativeName('ABC Company', 300, 250);
    expect(name).toBe('abc_company_300x250');
  });
});
