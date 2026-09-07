/**
 * Sanitizes a string according to Google Ad Manager naming conventions:
 * - Lowercase
 * - Replace whitespace and dashes with underscores
 * - Remove special characters (keep only alphanumeric and underscores)
 * - Strip consecutive underscores and trim
 */
export function sanitizeName(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Format a Date or date string to YYYY_MM_DD for naming
 */
export function formatDateForName(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) {
    // If not a valid standard date, extract digits or sanitize
    return sanitizeName(String(dateStr));
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}_${month}_${day}`;
}

/**
 * Generates an Ad Unit code: {website}_{position}_{width}x{height}
 * Example: newstrack_homepage_300x250
 */
export function generateAdUnitCode(websiteOrAdvertiser: string, position: string, width: number, height: number): string {
  const base = sanitizeName(websiteOrAdvertiser || 'site');
  const pos = sanitizeName(position || 'homepage');
  return `${base}_${pos}_${width}x${height}`;
}

/**
 * Generates an Ad Unit display name: {website}_{position}_{width}x{height}
 */
export function generateAdUnitName(websiteOrAdvertiser: string, position: string, width: number, height: number): string {
  return generateAdUnitCode(websiteOrAdvertiser, position, width, height);
}

/**
 * Generates an Order name: {advertiser_name}_{campaign_date}
 * Example: abc_company_2026_08_20
 */
export function generateOrderName(advertiserName: string, startDate: string | Date): string {
  const base = sanitizeName(advertiserName);
  const dateFormatted = formatDateForName(startDate);
  return `${base}_${dateFormatted}`;
}

/**
 * Generates a Line Item name: {advertiser_name}_{position}_{width}x{height}
 * Example: abc_company_homepage_300x250
 */
export function generateLineItemName(advertiserName: string, position: string, width: number, height: number): string {
  const base = sanitizeName(advertiserName);
  const pos = sanitizeName(position || 'homepage');
  return `${base}_${pos}_${width}x${height}`;
}

/**
 * Generates a Creative name: {advertiser_name}_{width}x{height}
 * Example: abc_company_300x250
 */
export function generateCreativeName(advertiserName: string, width: number, height: number): string {
  const base = sanitizeName(advertiserName);
  return `${base}_${width}x${height}`;
}
