import { generateGPTDivId, generateGPTTags } from '../src/utils/gptGenerator';

describe('GPT Generator', () => {
  test('generateGPTDivId generates unique valid DOM IDs', () => {
    const divId1 = generateGPTDivId();
    const divId2 = generateGPTDivId();

    expect(divId1).toMatch(/^div-gpt-ad-\d+-\d$/);
    expect(divId2).toMatch(/^div-gpt-ad-\d+-\d$/);
  });

  test('generateGPTTags generates valid head, body, and complete tags', () => {
    const tags = generateGPTTags('22068249324', 'ashutosh_homepage_300x250', { width: 300, height: 250 });

    expect(tags.headCode).toContain("googletag.defineSlot('/22068249324/ashutosh_homepage_300x250', [300, 250]");
    expect(tags.headCode).toContain('.addService(googletag.pubads())');
    expect(tags.headCode).toContain('googletag.pubads().enableSingleRequest()');
    expect(tags.headCode).toContain('googletag.enableServices()');

    expect(tags.bodyCode).toContain(`<div class="hocal-ad" id='${tags.divId}' style="text-align:center;">Advertisement`);
    expect(tags.bodyCode).toContain(`window.insertInfiniteDFPAdd("${tags.divId}","'/22068249324/ashutosh_homepage_300x250', [300, 250]");`);

    expect(tags.completeCode).toContain('<!DOCTYPE html>');
    expect(tags.completeCode).toContain(tags.headCode);
    expect(tags.completeCode).toContain(tags.bodyCode);
  });
});

