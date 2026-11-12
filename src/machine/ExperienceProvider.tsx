import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import { motionValue } from 'framer-motion';
import type { ContentBundle } from '@/content/types';
import { hold, holdDurationMs } from '@/design/motion';
import { initialState, reducer } from './reducer';
import type { Action, ExperienceState } from './types';
import { ExperienceContext, HoldProgressContext } from './useExperience';
import type { ExperienceContextValue } from './useExperience';

/** A background tab or a long frame must not jump the hold forward. */
const MAX_FRAME_MS = 64;

export interface ExperienceProviderProps {
  bundle: ContentBundle;
  children: ReactNode;
  /** merged over `initialState()`; read once, at mount (dev routes and tests) */
  initial?: Partial<ExperienceState>;
}

function init(initial: Partial<ExperienceState> | undefined): ExperienceState {
  return { ...initialState(), ...initial };
}

export function ExperienceProvider({ bundle, children, initial }: ExperienceProviderProps) {
  const reduce = useCallback(
    (state: ExperienceState, action: Action) =>
      // the hold duration is read per dispatch, so a late __BOOSTER_HOLD_MS__ still counts
      reducer(state, action, {
        bundle,
        holdDurationMs: holdDurationMs(),
        cancelReturnMs: hold.cancelReturnMs,
      }),
    [bundle],
  );
  const [state, dispatch] = useReducer(reduce, initial, init);
  const [holdProgressMV] = useState(() => motionValue(init(initial).holdProgress));

  useEffect(() => {
    holdProgressMV.set(state.holdProgress);
  }, [holdProgressMV, state.holdProgress]);

  // The hold loop: one HOLD_TICK per frame while holding ('up') or relaxing ('down').
  const ticking = state.holdDirection !== 'idle';
  useEffect(() => {
    if (!ticking) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const dtMs = Math.min(Math.max(now - last, 0), MAX_FRAME_MS);
      last = now;
      dispatch({ type: 'HOLD_TICK', dtMs });
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [ticking]);

  // Leaving the page releases the hold (the machine ignores HOLD_END when nothing is held).
  useEffect(() => {
    const release = () => dispatch({ type: 'HOLD_END' });
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') release();
    };
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const value = useMemo<ExperienceContextValue>(() => ({ state, dispatch, bundle }), [state, bundle]);

  return (
    <HoldProgressContext.Provider value={holdProgressMV}>
      <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>
    </HoldProgressContext.Provider>
  );
}
