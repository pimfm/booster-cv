/** Pure i18n helpers. The React side lives in LocaleProvider.tsx / useLocale.ts. */
import { LOCALES } from '@/content/types';
import type { Locale, Localized, StringKey, StringValue, Strings } from '@/content/types';

export type Vars = Record<string, string | number>;

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'booster.locale';
export const LOCALE_QUERY_PARAM = 'lang';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Replaces `{name}` with `vars.name`; unknown placeholders are left as written. */
export function interpolate(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : match,
  );
}

/** A plain string, or the plural form picked by `vars.n` (1 → one, anything else → other). */
export function resolveString(value: StringValue, vars: Vars = {}): string {
  if (typeof value === 'string') return interpolate(value, vars);
  return interpolate(Number(vars.n) === 1 ? value.one : value.other, vars);
}

export function translate(strings: Strings, key: StringKey, vars?: Vars): string {
  return resolveString(strings[key], vars);
}

export function localize(text: Localized, locale: Locale): string {
  return text[locale];
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'nl' : 'en';
}

export interface LocaleSources {
  /** `location.search` */
  search?: string | undefined;
  /** the stored choice, if any */
  stored?: string | null | undefined;
  /** `navigator.languages` */
  languages?: readonly string[] | undefined;
}

/** `?lang=` → stored choice → first browser language that is nl* or en* → 'en'. */
export function detectLocale({ search, stored, languages }: LocaleSources): Locale {
  const fromQuery = new URLSearchParams(search ?? '').get(LOCALE_QUERY_PARAM)?.toLowerCase();
  if (isLocale(fromQuery)) return fromQuery;
  if (isLocale(stored)) return stored;
  for (const language of languages ?? []) {
    const primary = language.toLowerCase().split('-')[0];
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}
