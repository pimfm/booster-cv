/**
 * The experience contract (PLAN §5, INTERACTION-SPEC). Every lane builds against these
 * types; changing them means changing docs/INTERACTION-SPEC.md in the same PR.
 */
import type { ContentBundle } from '@/content/types';

export const PHASES = [
  'sealed',
  'unwrapping',
  'box-open',
  'pack-focused',
  'pack-tearing',
  'revealing',
  'card-on-stage',
  'card-detail',
  'pack-complete',
  'all-collected',
  'resetting',
] as const;

export type Phase = (typeof PHASES)[number];

/** 'up' while held, 'down' while relaxing after an early release, 'idle' otherwise. */
export type HoldDirection = 'up' | 'down' | 'idle';
export type HoldTarget = 'box' | 'pack';

export interface ExperienceState {
  phase: Phase;
  /** set from FOCUS_PACK until DISMISS_PACK / UNFOCUS_PACK */
  focusedPackId: string | null;
  /** LINEAR time fraction 0..1 — visuals apply `holdCurve` (see `holdVisual`) */
  holdProgress: number;
  holdDirection: HoldDirection;
  /** what is being held or is relaxing; null when idle */
  holdTarget: HoldTarget | null;
  /** null until the first early release, then a counter (1, 2, …) — not a timestamp */
  lastHoldCancelledAt: number | null;
  /** cards still to draw, top first */
  queue: string[];
  stageCardId: string | null;
  detailCardId: string | null;
  /** where CLOSE_DETAIL goes back to; only set in 'card-detail' */
  returnPhase: Phase | null;
  /** the binder, in collection order */
  collected: string[];
  /** in the order the packs were finished */
  openedPacks: string[];
  /** a rare or holo card has been drawn (or hydrated) at least once */
  seenRare: boolean;
}

/** What persistence stores and feeds back through HYDRATE. */
export interface PersistedState {
  collected: readonly string[];
  openedPacks: readonly string[];
}

export type Action =
  | { type: 'HOLD_START' }
  | { type: 'HOLD_TICK'; dtMs: number }
  | { type: 'HOLD_END' }
  | { type: 'TEAR_COMPLETE' }
  | { type: 'FOCUS_PACK'; packId: string }
  | { type: 'UNFOCUS_PACK' }
  | { type: 'DRAW_CARD' }
  | { type: 'OPEN_DETAIL'; cardId?: string }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'COLLECT_CARD' }
  | { type: 'DISMISS_PACK' }
  | { type: 'RESET' }
  | { type: 'RESET_DONE' }
  | { type: 'HYDRATE'; collected: readonly string[]; openedPacks: readonly string[] };

export type ActionType = Action['type'];

export const ACTION_TYPES = [
  'HOLD_START',
  'HOLD_TICK',
  'HOLD_END',
  'TEAR_COMPLETE',
  'FOCUS_PACK',
  'UNFOCUS_PACK',
  'DRAW_CARD',
  'OPEN_DETAIL',
  'CLOSE_DETAIL',
  'COLLECT_CARD',
  'DISMISS_PACK',
  'RESET',
  'RESET_DONE',
  'HYDRATE',
] as const satisfies readonly ActionType[];

export interface ReducerContext {
  bundle: ContentBundle;
  /** full 0 → 1 hold time */
  holdDurationMs: number;
  /** full 1 → 0 relax time after an early release */
  cancelReturnMs: number;
}

export type ExperienceReducer = (state: ExperienceState, action: Action) => ExperienceState;
export type ExperienceDispatch = (action: Action) => void;
