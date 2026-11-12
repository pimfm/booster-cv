/** Public API of i18n. Import from '@/platform/i18n'. */
export { LocaleProvider } from './LocaleProvider';
export type { LocaleProviderProps } from './LocaleProvider';
export { useLocale } from './useLocale';
export type { LocaleContextValue } from './useLocale';
export {
  DEFAULT_LOCALE,
  LOCALE_QUERY_PARAM,
  LOCALE_STORAGE_KEY,
  detectLocale,
  interpolate,
  isLocale,
  localize,
  otherLocale,
  resolveString,
  translate,
} from './t';
export type { LocaleSources, Vars } from './t';
