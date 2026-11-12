/** Contexts and hooks for the experience. The provider lives in ExperienceProvider.tsx. */
import { createContext, useContext } from 'react';
import type { MotionValue } from 'framer-motion';
import type { ContentBundle } from '@/content/types';
import type { ExperienceDispatch, ExperienceState } from './types';

export interface ExperienceContextValue {
  state: ExperienceState;
  dispatch: ExperienceDispatch;
  bundle: ContentBundle;
}

export const ExperienceContext = createContext<ExperienceContextValue | null>(null);
/** Separate from the state context: reading only the motion value never re-renders. */
export const HoldProgressContext = createContext<MotionValue<number> | null>(null);

function outsideProvider(hook: string): Error {
  return new Error(`${hook}() must be used inside <ExperienceProvider>.`);
}

/** State, dispatch and the content bundle. Re-renders on every state change. */
export function useExperience(): ExperienceContextValue {
  const value = useContext(ExperienceContext);
  if (value === null) throw outsideProvider('useExperience');
  return value;
}

/** LINEAR hold progress 0..1 as a Framer Motion value (pair with `holdVisual`). */
export function useHoldProgress(): MotionValue<number> {
  const value = useContext(HoldProgressContext);
  if (value === null) throw outsideProvider('useHoldProgress');
  return value;
}

/** `useExperienceSelector(isComplete)` — runs a (state, bundle) selector from ./selectors. */
export function useExperienceSelector<T>(selector: (state: ExperienceState, bundle: ContentBundle) => T): T {
  const value = useContext(ExperienceContext);
  if (value === null) throw outsideProvider('useExperienceSelector');
  return selector(value.state, value.bundle);
}
