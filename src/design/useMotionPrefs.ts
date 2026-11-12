import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { getDur, getSpring, reducedTransition } from './motion';
import type { DurName, ReducedTransition, SpringConfig, SpringName } from './motion';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Duration (seconds) returned by `dur()` under reduced motion. */
const REDUCED_DUR = reducedTransition.duration;

export interface MotionPrefs {
  /** True when the visitor asked for reduced motion. */
  readonly reduced: boolean;
  /** Framer Motion transition for a named spring; `{ duration: 0.01 }` when reduced. */
  spring(name: SpringName): SpringConfig | ReducedTransition;
  /** Duration in seconds for a named step; `0.01` when reduced. */
  dur(name: DurName): number;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

const getServerSnapshot = (): boolean => false;

/**
 * The one place components learn about reduced motion. Call this instead of Framer
 * Motion's `useReducedMotion` so the reduced path and the dev/test motion overrides
 * stay consistent.
 */
export function useMotionPrefs(): MotionPrefs {
  const reduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const spring = useCallback(
    (name: SpringName) => (reduced ? reducedTransition : getSpring(name)),
    [reduced],
  );
  const dur = useCallback((name: DurName) => (reduced ? REDUCED_DUR : getDur(name)), [reduced]);
  return useMemo(() => ({ reduced, spring, dur }), [reduced, spring, dur]);
}
