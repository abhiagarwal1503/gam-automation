import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  robots?: string;
  canonicalPath?: string;
  breadcrumbs?: Array<{ name: string; item: string }>;
}

const DEFAULT_TITLE = 'Google Ad Manager Automation | Enterprise Ad Trafficking Platform';
const DEFAULT_DESCRIPTION =
  'Automate your Google Ad Manager operations. Instantly create Orders, Line Items, Creatives, LICAs, and production-ready GPT snippet tags with multi-network and advertiser scoping.';
const BASE_URL = 'https://gam-automation.example.com';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  robots = 'index, follow',
  canonicalPath = '',
  breadcrumbs
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title ? `${title} | GAM Automation` : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper: update or create meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // 2. Primary Meta Tags
    setMetaTag('description', description);
    setMetaTag('robots', robots);
    if (keywords) {
      setMetaTag('keywords', keywords);
    }

    // 3. OpenGraph Tags
    setMetaTag('og:title', formattedTitle, true);
    setMetaTag('og:description', description, true);
    const fullUrl = `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
    setMetaTag('og:url', fullUrl, true);

    // 4. Twitter Card Tags
    setMetaTag('twitter:title', formattedTitle);
    setMetaTag('twitter:description', description);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;

    // 6. JSON-LD Breadcrumb Structured Data
    const BREADCRUMB_SCRIPT_ID = 'seo-breadcrumb-jsonld';
    let breadcrumbScript = document.getElementById(BREADCRUMB_SCRIPT_ID) as HTMLScriptElement;

    if (breadcrumbs && breadcrumbs.length > 0) {
      if (!breadcrumbScript) {
        breadcrumbScript = document.createElement('script');
        breadcrumbScript.id = BREADCRUMB_SCRIPT_ID;
        breadcrumbScript.type = 'application/ld+json';
        document.head.appendChild(breadcrumbScript);
      }

      const breadcrumbList = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${BASE_URL}/`
          },
          ...breadcrumbs.map((b, idx) => ({
            '@type': 'ListItem',
            position: idx + 2,
            name: b.name,
            item: b.item.startsWith('http') ? b.item : `${BASE_URL}${b.item.startsWith('/') ? b.item : `/${b.item}`}`
          }))
        ]
      };

      breadcrumbScript.textContent = JSON.stringify(breadcrumbList);
    } else if (breadcrumbScript) {
      breadcrumbScript.remove();
    }
  }, [title, description, keywords, robots, canonicalPath, breadcrumbs]);

  return null;
};
