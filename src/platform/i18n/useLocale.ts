import { createContext, useContext } from 'react';
import type { Locale, Localized, StringKey } from '@/content/types';
import type { Vars } from './t';

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** switch to the other locale */
  toggle: () => void;
  /** UI string by key; `{name}` placeholders from `vars`, plurals by `vars.n` */
  t: (key: StringKey, vars?: Vars) => string;
  /** the current-locale side of a `Localized` content value */
  L: (text: Localized) => string;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (value === null) throw new Error('useLocale() must be used inside <LocaleProvider>.');
  return value;
}
