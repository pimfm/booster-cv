import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Locale, Localized, StringKey, Strings } from '@/content/types';
import { LOCALE_STORAGE_KEY, detectLocale, localize, otherLocale, translate } from './t';
import type { Vars } from './t';
import { LocaleContext } from './useLocale';
import type { LocaleContextValue } from './useLocale';

function readStored(): string | null {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null; // storage blocked: fall through to the browser language
  }
}

function writeStored(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // storage blocked or full: the choice lasts for this visit only
  }
}

function initialLocale(): Locale {
  if (typeof window === 'undefined') return detectLocale({});
  return detectLocale({
    search: window.location.search,
    stored: readStored(),
    languages: window.navigator.languages,
  });
}

export interface LocaleProviderProps {
  /** `bundle.strings` */
  strings: Record<Locale, Strings>;
  children: ReactNode;
  /** skips detection (tests, dev routes) */
  initial?: Locale;
}

export function LocaleProvider({ strings, children, initial }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => initial ?? initialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    writeStored(next);
    setLocaleState(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      toggle: () => setLocale(otherLocale(locale)),
      t: (key: StringKey, vars?: Vars) => translate(strings[locale], key, vars),
      L: (text: Localized) => localize(text, locale),
    }),
    [locale, setLocale, strings],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
