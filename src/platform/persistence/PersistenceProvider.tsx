import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useExperience } from '@/machine';
import type { PersistedState } from '@/machine';
import { PersistedSoundContext } from './sound';
import type { PersistedSound } from './sound';
import { bootState, clearAll, clearProgress, defaultStorage, saveProgress, saveSound } from './storage';
import type { StorageLike } from './storage';

/** Writes wait this long after the last binder change (a burst of collects is one write). */
export const WRITE_DEBOUNCE_MS = 150;

export interface PersistenceProviderProps {
  children: ReactNode;
  /** tests: a fake storage (null = unavailable). Default `window.localStorage`. */
  storage?: StorageLike | null;
}

function currentSearch(): string {
  return typeof window === 'undefined' ? '' : window.location.search;
}

/** Drops `fresh` from the address bar, so a reload keeps what was stored since. */
function stripFresh(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('fresh');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // no history API: harmless
  }
}

/**
 * PL-02. Hydrates the machine once on mount (before any write), saves `collected` /
 * `openedPacks` debounced, clears the binder when a reset starts, flushes on `pagehide`.
 * Dev only: `?fresh` clears `booster.v1` first; `?state=all|<packId>,<packId>` hydrates a
 * filled binder. Storage failures are swallowed.
 */
export function PersistenceProvider({ children, storage: storageProp }: PersistenceProviderProps) {
  const { state, dispatch, bundle } = useExperience();
  const contentVersion = bundle.meta.contentVersion;
  const [storage] = useState<StorageLike | null>(() =>
    storageProp === undefined ? defaultStorage() : storageProp,
  );
  const [boot] = useState(() => bootState(bundle, storage, currentSearch(), import.meta.env.DEV));
  const [sound, setSoundState] = useState(boot.sound);

  // ── hydrate: once, on mount, before any write ───────────────────────────
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (boot.fresh) {
      clearAll(storage);
      stripFresh();
    }
    if (boot.progress !== null) dispatch({ type: 'HYDRATE', ...boot.progress });
  }, [boot, dispatch, storage]);

  // ── write: debounced, only once the binder differs from the one we mounted with ──
  const { collected, openedPacks, phase } = state;
  const mounted = useRef({ collected, openedPacks });
  const pending = useRef<PersistedState | null>(null);

  const flush = useCallback(() => {
    const progress = pending.current;
    if (progress === null) return;
    pending.current = null;
    saveProgress(storage, contentVersion, progress);
  }, [storage, contentVersion]);

  useEffect(() => {
    if (collected === mounted.current.collected && openedPacks === mounted.current.openedPacks) return;
    pending.current = { collected, openedPacks };
    const timer = window.setTimeout(flush, WRITE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [collected, openedPacks, flush]);

  // a reset clears the stored binder at once (the sound choice stays)
  useEffect(() => {
    if (phase !== 'resetting') return;
    pending.current = null;
    clearProgress(storage, contentVersion);
  }, [phase, storage, contentVersion]);

  // leaving the page (or unmounting) must not lose the last 150 ms
  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  // ── sound ───────────────────────────────────────────────────────────────
  const setSound = useCallback(
    (on: boolean) => {
      setSoundState(on);
      saveSound(storage, contentVersion, on);
    },
    [storage, contentVersion],
  );
  const soundValue = useMemo<PersistedSound>(() => [sound, setSound], [sound, setSound]);

  return <PersistedSoundContext.Provider value={soundValue}>{children}</PersistedSoundContext.Provider>;
}
