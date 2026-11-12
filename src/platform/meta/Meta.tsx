import { useEffect } from 'react';
import type { Locale, Meta as MetaContent } from '@/content/types';
import { otherLocale, useLocale } from '@/platform/i18n';

/** Open Graph locale codes for the two site locales. */
export const OG_LOCALE: Record<Locale, string> = { en: 'en_GB', nl: 'nl_NL' };

type Attr = 'name' | 'property';

/** Finds `<meta {attr}="{key}">` in <head>, creating it when absent, and sets its content. */
export function setHeadMeta(attr: Attr, key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (el === null) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.append(el);
  }
  el.setAttribute('content', content);
}

/**
 * Keeps the document head in step with the current locale: title, description and the
 * OG/Twitter text tags. Crawlers read the static English defaults in index.html; this only
 * matters for people (tab title, bookmarks, share sheets that read the live DOM).
 */
export function Meta({ meta }: { meta: MetaContent }) {
  const { locale, L } = useLocale();
  const title = L(meta.og.title);
  const description = L(meta.og.description);

  useEffect(() => {
    document.title = title;
    setHeadMeta('name', 'description', description);
    setHeadMeta('property', 'og:title', title);
    setHeadMeta('property', 'og:description', description);
    setHeadMeta('property', 'og:locale', OG_LOCALE[locale]);
    setHeadMeta('property', 'og:locale:alternate', OG_LOCALE[otherLocale(locale)]);
    setHeadMeta('name', 'twitter:title', title);
    setHeadMeta('name', 'twitter:description', description);
  }, [locale, title, description]);

  return null;
}
