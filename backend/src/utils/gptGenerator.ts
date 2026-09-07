import { sanitizeName } from './sanitizer';
import { AdSize } from '../types';

/**
 * Generates a unique DOM ID for a GPT ad slot
 * Example: div-gpt-ad-1788354905341-0
 */
export function generateGPTDivId(
  websiteOrAdvertiser?: string,
  position?: string,
  width?: number,
  height?: number
): string {
  const timestamp = Date.now();
  const index = Math.floor(Math.random() * 10);
  return `div-gpt-ad-${timestamp}-${index}`;
}

/**
 * Generates Google Publisher Tag (GPT) head, body, and full HTML snippets in the custom infinite DFP format
 */
export function generateGPTTags(
  networkCode: string,
  adUnitCode: string,
  size: AdSize,
  divId?: string
): {
  divId: string;
  headCode: string;
  bodyCode: string;
  completeCode: string;
} {
  const cleanNetworkCode = (networkCode || '12345678').trim();
  const cleanAdUnitCode = (adUnitCode || 'ad_unit_slot').trim();
  const width = size.width;
  const height = size.height;
  const slotDivId = divId || generateGPTDivId();

  const headCode = `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js" crossorigin="anonymous"></script>
<script>
  window.googletag = window.googletag || {cmd: []};
  googletag.cmd.push(function() {
    googletag.defineSlot('/${cleanNetworkCode}/${cleanAdUnitCode}', [${width}, ${height}], '${slotDivId}')
      .addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });
</script>`;

  const bodyCode = `<div class="hocal-ad" id='${slotDivId}' style="text-align:center;">Advertisement
  <script>
  window.insertInfiniteDFPAdd("${slotDivId}","'/${cleanNetworkCode}/${cleanAdUnitCode}', [${width}, ${height}]");
  </script></div>`;

  const completeCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>GPT Ad Preview - ${cleanAdUnitCode}</title>
  ${headCode}
</head>
<body style="font-family: sans-serif; padding: 20px; background-color: #f8fafc;">
  <h2>Ad Slot: /${cleanNetworkCode}/${cleanAdUnitCode} (${width}x${height})</h2>
  <div style="border: 1px dashed #cbd5e1; display: inline-block; padding: 4px; background: #ffffff;">
    ${bodyCode}
  </div>
</body>
</html>`;

  return {
    divId: slotDivId,
    headCode,
    bodyCode,
    completeCode
  };
}

