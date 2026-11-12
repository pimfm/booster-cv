/** Public API of the experience machine (PLAN §5). Import from '@/machine'. */
export { ACTION_TYPES, PHASES } from './types';
export type {
  Action,
  ActionType,
  ExperienceDispatch,
  ExperienceReducer,
  ExperienceState,
  HoldDirection,
  HoldTarget,
  PersistedState,
  Phase,
  ReducerContext,
} from './types';
export { VALID_ACTIONS, createReducer, initialState, reducer } from './reducer';
export { advanceHold, crossedMark, holdCurve, relaxHold } from './hold';
export {
  collectedCount,
  detailCard,
  focusedPack,
  holdVisual,
  isComplete,
  isHolding,
  isPackOpened,
  progressByPack,
  remainingInPack,
  stageCard,
  totalCount,
} from './selectors';
export type { HoldVisual, PackProgress } from './selectors';
export { ExperienceProvider } from './ExperienceProvider';
export type { ExperienceProviderProps } from './ExperienceProvider';
export { useExperience, useExperienceSelector, useHoldProgress } from './useExperience';
export type { ExperienceContextValue } from './useExperience';
