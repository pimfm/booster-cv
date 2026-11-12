/**
 * The experience reducer — pure, no clocks, no DOM. INTERACTION-SPEC §1–§8.
 * `VALID_ACTIONS` is the whole validity table: any other (phase, action) pair, and any
 * valid pair whose guard fails, returns the SAME state object.
 */
import { cardsInPack, getCard, getPack } from '@/content/bundle';
import type { ContentBundle, Pack } from '@/content/types';
import { advanceHold, relaxHold } from './hold';
import type {
  Action,
  ActionType,
  ExperienceReducer,
  ExperienceState,
  Phase,
  ReducerContext,
} from './types';

export const VALID_ACTIONS: Readonly<Record<Phase, readonly ActionType[]>> = {
  sealed: ['HOLD_START', 'HOLD_TICK', 'TEAR_COMPLETE', 'OPEN_DETAIL', 'RESET', 'HYDRATE'],
  unwrapping: ['HOLD_TICK', 'HOLD_END', 'TEAR_COMPLETE'],
  'box-open': ['FOCUS_PACK', 'OPEN_DETAIL', 'RESET'],
  'pack-focused': ['HOLD_START', 'HOLD_TICK', 'TEAR_COMPLETE', 'UNFOCUS_PACK', 'OPEN_DETAIL', 'RESET'],
  'pack-tearing': ['HOLD_TICK', 'HOLD_END', 'TEAR_COMPLETE'],
  revealing: ['DRAW_CARD', 'OPEN_DETAIL', 'RESET'],
  'card-on-stage': ['OPEN_DETAIL', 'COLLECT_CARD', 'RESET'],
  'card-detail': ['CLOSE_DETAIL', 'COLLECT_CARD', 'RESET'],
  'pack-complete': ['DISMISS_PACK', 'OPEN_DETAIL', 'RESET'],
  'all-collected': ['DRAW_CARD', 'OPEN_DETAIL', 'RESET'],
  resetting: ['RESET_DONE'],
};

export function initialState(): ExperienceState {
  return {
    phase: 'sealed',
    focusedPackId: null,
    holdProgress: 0,
    holdDirection: 'idle',
    holdTarget: null,
    lastHoldCancelledAt: null,
    queue: [],
    stageCardId: null,
    detailCardId: null,
    returnPhase: null,
    collected: [],
    openedPacks: [],
    seenRare: false,
  };
}

const HOLD_RESET = { holdProgress: 0, holdDirection: 'idle', holdTarget: null } as const;

function appendUnique(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id];
}

function unique(list: readonly string[]): string[] {
  return [...new Set(list)];
}

function isRare(bundle: ContentBundle, cardId: string): boolean {
  const rarity = getCard(bundle, cardId)?.rarity;
  return rarity === 'rare' || rarity === 'holo';
}

/** The final queue: the contact card, unless it is already in the binder. */
function contactQueue(bundle: ContentBundle, collected: readonly string[]): string[] {
  const contactId = bundle.meta.contactCard.id;
  return collected.includes(contactId) ? [] : [contactId];
}

function allPacksOpened(bundle: ContentBundle, openedPacks: readonly string[]): boolean {
  return bundle.packs.every((pack) => openedPacks.includes(pack.id));
}

function holdStart(state: ExperienceState): ExperienceState {
  return state.phase === 'sealed'
    ? { ...state, phase: 'unwrapping', holdDirection: 'up', holdTarget: 'box' }
    : { ...state, phase: 'pack-tearing', holdDirection: 'up', holdTarget: 'pack' };
}

function holdEnd(state: ExperienceState): ExperienceState {
  const settled = state.holdProgress <= 0;
  return {
    ...state,
    phase: state.phase === 'unwrapping' ? 'sealed' : 'pack-focused',
    holdDirection: settled ? 'idle' : 'down',
    holdTarget: settled ? null : state.holdTarget,
    lastHoldCancelledAt: (state.lastHoldCancelledAt ?? 0) + 1,
  };
}

/** The hold reached 1 (or TEAR_COMPLETE forced it): open the box or tear the pack. */
function completeHold(state: ExperienceState, ctx: ReducerContext): ExperienceState {
  if (state.phase === 'sealed' || state.phase === 'unwrapping') {
    return { ...state, ...HOLD_RESET, phase: 'box-open' };
  }
  const packId = state.focusedPackId;
  if (packId === null) return state;
  const queue = cardsInPack(ctx.bundle, packId)
    .map((card) => card.id)
    .filter((id) => !state.collected.includes(id));
  if (queue.length === 0) {
    // nothing left to draw (an empty pack): it is done the moment it tears
    return {
      ...state,
      ...HOLD_RESET,
      phase: 'pack-complete',
      openedPacks: appendUnique(state.openedPacks, packId),
    };
  }
  return { ...state, ...HOLD_RESET, phase: 'revealing', queue };
}

function holdTick(state: ExperienceState, dtMs: number, ctx: ReducerContext): ExperienceState {
  if (state.holdDirection === 'up') {
    const next = advanceHold(state.holdProgress, dtMs, ctx.holdDurationMs);
    if (next >= 1) return completeHold(state, ctx);
    return next === state.holdProgress ? state : { ...state, holdProgress: next };
  }
  if (state.holdDirection === 'down') {
    const next = relaxHold(state.holdProgress, dtMs, ctx.cancelReturnMs);
    if (next <= 0) return { ...state, ...HOLD_RESET };
    return next === state.holdProgress ? state : { ...state, holdProgress: next };
  }
  return state;
}

function focusPack(state: ExperienceState, packId: string, bundle: ContentBundle): ExperienceState {
  if (!getPack(bundle, packId) || state.openedPacks.includes(packId)) return state;
  return { ...state, ...HOLD_RESET, phase: 'pack-focused', focusedPackId: packId };
}

function drawCard(state: ExperienceState, bundle: ContentBundle): ExperienceState {
  const [cardId, ...queue] = state.queue;
  if (cardId === undefined) return state;
  return {
    ...state,
    phase: 'card-on-stage',
    queue,
    stageCardId: cardId,
    seenRare: state.seenRare || isRare(bundle, cardId),
  };
}

function openDetail(state: ExperienceState, requested: string | undefined): ExperienceState {
  const onStage = state.phase === 'card-on-stage' ? state.stageCardId : null;
  const cardId = requested ?? onStage;
  if (cardId === null) return state;
  if (cardId !== onStage && !state.collected.includes(cardId)) return state;
  return {
    ...state,
    ...HOLD_RESET, // a relax in progress is settled, so the rAF loop stops under the overlay
    phase: 'card-detail',
    detailCardId: cardId,
    returnPhase: state.phase,
  };
}

function collectCard(state: ExperienceState, bundle: ContentBundle): ExperienceState {
  const cardId = state.stageCardId;
  if (cardId === null) return state;
  if (state.phase === 'card-detail' && state.detailCardId !== cardId) return state;
  const next: ExperienceState = {
    ...state,
    collected: appendUnique(state.collected, cardId),
    stageCardId: null,
    detailCardId: null,
    returnPhase: null,
  };
  if (state.queue.length > 0) return { ...next, phase: 'revealing' };
  if (cardId === bundle.meta.contactCard.id) return { ...next, phase: 'all-collected' };
  return {
    ...next,
    phase: 'pack-complete',
    openedPacks:
      state.focusedPackId === null
        ? state.openedPacks
        : appendUnique(state.openedPacks, state.focusedPackId),
  };
}

function dismissPack(state: ExperienceState, bundle: ContentBundle): ExperienceState {
  if (!allPacksOpened(bundle, state.openedPacks)) {
    return { ...state, phase: 'box-open', focusedPackId: null };
  }
  return {
    ...state,
    phase: 'all-collected',
    focusedPackId: null,
    queue: contactQueue(bundle, state.collected),
  };
}

function reset(state: ExperienceState): ExperienceState {
  // the binder (collected / openedPacks) stays until RESET_DONE so the UI can fade it out
  return {
    ...state,
    ...HOLD_RESET,
    phase: 'resetting',
    focusedPackId: null,
    queue: [],
    stageCardId: null,
    detailCardId: null,
    returnPhase: null,
  };
}

function hydrate(
  state: ExperienceState,
  persisted: { collected: readonly string[]; openedPacks: readonly string[] },
  bundle: ContentBundle,
): ExperienceState {
  if (state.holdDirection !== 'idle') return state;
  const collected = unique(persisted.collected).filter((id) => getCard(bundle, id) !== undefined);
  const listed = unique(persisted.openedPacks);
  // opened = every card collected; a pack without cards only when it was stored as opened
  const isOpened = (pack: Pack): boolean => {
    const cards = cardsInPack(bundle, pack.id);
    return cards.every((card) => collected.includes(card.id)) && (cards.length > 0 || listed.includes(pack.id));
  };
  const opened = bundle.packs.filter(isOpened).map((pack) => pack.id);
  // stored order first, then fully collected packs that were not stored, in shelf order
  const openedPacks = [...listed.filter((id) => opened.includes(id)), ...opened.filter((id) => !listed.includes(id))];
  if (collected.length === 0 && openedPacks.length === 0) return state;
  const complete = allPacksOpened(bundle, openedPacks);
  return {
    ...state,
    phase: complete ? 'all-collected' : 'box-open',
    queue: complete ? contactQueue(bundle, collected) : [],
    collected,
    openedPacks,
    seenRare: collected.some((id) => isRare(bundle, id)),
  };
}

export function reducer(state: ExperienceState, action: Action, ctx: ReducerContext): ExperienceState {
  if (!VALID_ACTIONS[state.phase].includes(action.type)) return state;
  switch (action.type) {
    case 'HOLD_START':
      return holdStart(state);
    case 'HOLD_TICK':
      return holdTick(state, action.dtMs, ctx);
    case 'HOLD_END':
      return holdEnd(state);
    case 'TEAR_COMPLETE':
      return completeHold(state, ctx);
    case 'FOCUS_PACK':
      return focusPack(state, action.packId, ctx.bundle);
    case 'UNFOCUS_PACK':
      return { ...state, ...HOLD_RESET, phase: 'box-open', focusedPackId: null };
    case 'DRAW_CARD':
      return drawCard(state, ctx.bundle);
    case 'OPEN_DETAIL':
      return openDetail(state, action.cardId);
    case 'CLOSE_DETAIL':
      return { ...state, phase: state.returnPhase ?? 'box-open', detailCardId: null, returnPhase: null };
    case 'COLLECT_CARD':
      return collectCard(state, ctx.bundle);
    case 'DISMISS_PACK':
      return dismissPack(state, ctx.bundle);
    case 'RESET':
      return reset(state);
    case 'RESET_DONE':
      return initialState();
    case 'HYDRATE':
      return hydrate(state, action, ctx.bundle);
  }
}

/** Binds the context, for `useReducer` and tests. */
export function createReducer(ctx: ReducerContext): ExperienceReducer {
  return (state, action) => reducer(state, action, ctx);
}
