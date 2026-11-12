import { describe, expect, it } from 'vitest';
import { createBundle, totalCards, totalWithContact } from '@/content/bundle';
import { makeCard, makeMeta, makePack, makeParts } from '@/content/testkit';
import type { Card, ContentBundle } from '@/content/types';
import metaContent from '@content/meta';
import packsContent from '@content/packs';
import en from '@content/strings.en';
import nl from '@content/strings.nl';
import { VALID_ACTIONS, createReducer, initialState, reducer } from './reducer';
import { isComplete } from './selectors';
import { ACTION_TYPES, PHASES } from './types';
import type { Action, ExperienceState, Phase, ReducerContext } from './types';

/** packs: one = a b c (c is rare), two = d e; contact card 'contact' (holo). */
function fixtureBundle(): ContentBundle {
  const parts = makeParts();
  return createBundle({
    ...parts,
    cards: parts.cards.map((card) => (card.id === 'c' ? { ...card, rarity: 'rare' as const } : card)),
  });
}

const bundle = fixtureBundle();
const ctx: ReducerContext = { bundle, holdDurationMs: 900, cancelReturnMs: 260 };
const reduce = createReducer(ctx);

function run(state: ExperienceState, ...actions: Action[]): ExperienceState {
  return actions.reduce(reduce, state);
}

function at(overrides: Partial<ExperienceState>): ExperienceState {
  return { ...initialState(), ...overrides };
}

const tick = (dtMs: number): Action => ({ type: 'HOLD_TICK', dtMs });
const DRAW: Action = { type: 'DRAW_CARD' };
const COLLECT: Action = { type: 'COLLECT_CARD' };

/** Named waypoints of a normal run over the fixture bundle. */
const sealed = initialState();
const unwrapping = run(sealed, { type: 'HOLD_START' }, tick(450));
const sealedRelaxing = run(unwrapping, { type: 'HOLD_END' });
const boxOpen = run(sealed, { type: 'TEAR_COMPLETE' });
const packFocused = run(boxOpen, { type: 'FOCUS_PACK', packId: 'one' });
const packTearing = run(packFocused, { type: 'HOLD_START' }, tick(450));
const packRelaxing = run(packTearing, { type: 'HOLD_END' });
const revealing = run(packFocused, { type: 'TEAR_COMPLETE' });
const onStage = run(revealing, DRAW);
const stageDetail = run(onStage, { type: 'OPEN_DETAIL' });
const revealingSecond = run(onStage, COLLECT);
const onStageSecond = run(revealingSecond, DRAW);
const binderDetail = run(revealingSecond, { type: 'OPEN_DETAIL', cardId: 'a' });
const packComplete = run(onStageSecond, COLLECT, DRAW, COLLECT);
const boxOpenAfterOne = run(packComplete, { type: 'DISMISS_PACK' });
const allCollected = run(
  boxOpenAfterOne,
  { type: 'FOCUS_PACK', packId: 'two' },
  { type: 'TEAR_COMPLETE' },
  DRAW,
  COLLECT,
  DRAW,
  COLLECT,
  { type: 'DISMISS_PACK' },
);
const contactOnStage = run(allCollected, DRAW);
const complete = run(contactOnStage, COLLECT);
const resetting = run(complete, { type: 'RESET' });

describe('initialState', () => {
  it('is the sealed box with an empty binder', () => {
    expect(initialState()).toEqual({
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
    });
    expect(initialState()).not.toBe(initialState());
  });
});

describe('hold on the box', () => {
  it('HOLD_START: sealed → unwrapping, target box', () => {
    const next = run(sealed, { type: 'HOLD_START' });
    expect(next).toMatchObject({ phase: 'unwrapping', holdDirection: 'up', holdTarget: 'box', holdProgress: 0 });
  });

  it('HOLD_TICK advances linearly', () => {
    expect(unwrapping.holdProgress).toBeCloseTo(0.5, 10);
    expect(run(unwrapping, tick(225)).holdProgress).toBeCloseTo(0.75, 10);
  });

  it('a tick that moves nothing returns the same state', () => {
    expect(run(unwrapping, tick(0))).toBe(unwrapping);
    expect(run(sealedRelaxing, tick(0))).toBe(sealedRelaxing);
    expect(run(sealed, tick(16))).toBe(sealed); // idle
    expect(run(packFocused, tick(16))).toBe(packFocused); // idle
  });

  it('reaching 1 opens the box and settles the hold', () => {
    const next = run(unwrapping, tick(450));
    expect(next).toMatchObject({
      phase: 'box-open',
      holdProgress: 0,
      holdDirection: 'idle',
      holdTarget: null,
      lastHoldCancelledAt: null,
    });
  });

  it('opens after ceil(duration / 16) frames, not one earlier', () => {
    let state = run(sealed, { type: 'HOLD_START' });
    const frames = Math.ceil(900 / 16);
    for (let i = 0; i < frames - 1; i += 1) state = run(state, tick(16));
    expect(state.phase).toBe('unwrapping');
    expect(run(state, tick(16)).phase).toBe('box-open');
  });

  it('HOLD_END early: back to sealed, relaxing, cancel counter + 1', () => {
    expect(sealedRelaxing).toMatchObject({
      phase: 'sealed',
      holdDirection: 'down',
      holdTarget: 'box',
      lastHoldCancelledAt: 1,
    });
    expect(sealedRelaxing.holdProgress).toBeCloseTo(0.5, 10);
  });

  it('relaxes to 0 over cancelReturnMs · progress, then goes idle', () => {
    const half = run(sealedRelaxing, tick(65));
    expect(half.holdProgress).toBeCloseTo(0.25, 10);
    expect(half.holdDirection).toBe('down');
    const done = run(half, tick(65));
    expect(done).toMatchObject({ phase: 'sealed', holdProgress: 0, holdDirection: 'idle', holdTarget: null });
    expect(done.lastHoldCancelledAt).toBe(1);
  });

  it('HOLD_START while relaxing resumes from the current progress', () => {
    const resumed = run(sealedRelaxing, tick(65), { type: 'HOLD_START' });
    expect(resumed).toMatchObject({ phase: 'unwrapping', holdDirection: 'up', holdTarget: 'box' });
    expect(resumed.holdProgress).toBeCloseTo(0.25, 10);
  });

  it('HOLD_END without progress settles at once but still counts as a cancel', () => {
    const next = run(sealed, { type: 'HOLD_START' }, { type: 'HOLD_END' });
    expect(next).toMatchObject({ phase: 'sealed', holdDirection: 'idle', holdTarget: null, lastHoldCancelledAt: 1 });
  });

  it('the cancel counter increases monotonically', () => {
    const again = run(sealedRelaxing, { type: 'HOLD_START' }, { type: 'HOLD_END' });
    expect(again.lastHoldCancelledAt).toBe(2);
  });

  it('TEAR_COMPLETE forces the box open from sealed, unwrapping and while relaxing', () => {
    for (const from of [sealed, unwrapping, sealedRelaxing]) {
      expect(run(from, { type: 'TEAR_COMPLETE' })).toMatchObject({
        phase: 'box-open',
        holdProgress: 0,
        holdDirection: 'idle',
        holdTarget: null,
      });
    }
  });

  it('uses the context durations', () => {
    const fast = createReducer({ ...ctx, holdDurationMs: 50, cancelReturnMs: 10 });
    const held = fast(fast(sealed, { type: 'HOLD_START' }), tick(25));
    expect(held.holdProgress).toBeCloseTo(0.5, 10);
    expect(fast(fast(held, { type: 'HOLD_END' }), tick(5)).holdDirection).toBe('idle');
    expect(fast(held, tick(25)).phase).toBe('box-open');
  });
});

describe('packs', () => {
  it('FOCUS_PACK: box-open → pack-focused', () => {
    expect(packFocused).toMatchObject({ phase: 'pack-focused', focusedPackId: 'one' });
  });

  it('FOCUS_PACK ignores unknown and opened packs', () => {
    expect(run(boxOpen, { type: 'FOCUS_PACK', packId: 'nope' })).toBe(boxOpen);
    expect(run(boxOpenAfterOne, { type: 'FOCUS_PACK', packId: 'one' })).toBe(boxOpenAfterOne);
  });

  it('UNFOCUS_PACK: back to the shelf, hold progress dropped', () => {
    const next = run(packRelaxing, { type: 'UNFOCUS_PACK' });
    expect(next).toMatchObject({
      phase: 'box-open',
      focusedPackId: null,
      holdProgress: 0,
      holdDirection: 'idle',
      holdTarget: null,
    });
  });

  it('HOLD_START: pack-focused → pack-tearing, target pack', () => {
    expect(packTearing).toMatchObject({ phase: 'pack-tearing', holdDirection: 'up', holdTarget: 'pack' });
    expect(packTearing.holdProgress).toBeCloseTo(0.5, 10);
  });

  it('HOLD_END early: back to pack-focused, relaxing; resumable', () => {
    expect(packRelaxing).toMatchObject({
      phase: 'pack-focused',
      focusedPackId: 'one',
      holdDirection: 'down',
      holdTarget: 'pack',
      lastHoldCancelledAt: 1,
    });
    expect(run(packRelaxing, tick(130))).toMatchObject({ holdProgress: 0, holdDirection: 'idle', holdTarget: null });
    expect(run(packRelaxing, { type: 'HOLD_START' })).toMatchObject({ phase: 'pack-tearing', holdDirection: 'up' });
  });

  it('a completed pack hold goes straight to revealing with the authored order', () => {
    const next = run(packTearing, tick(450));
    expect(next).toMatchObject({
      phase: 'revealing',
      focusedPackId: 'one',
      queue: ['a', 'b', 'c'],
      holdProgress: 0,
      holdDirection: 'idle',
      holdTarget: null,
    });
  });

  it('TEAR_COMPLETE tears from pack-focused, pack-tearing and while relaxing', () => {
    for (const from of [packFocused, packTearing, packRelaxing]) {
      expect(run(from, { type: 'TEAR_COMPLETE' })).toMatchObject({ phase: 'revealing', queue: ['a', 'b', 'c'] });
    }
  });

  it('the queue skips cards that are already collected', () => {
    const next = run(at({ phase: 'pack-focused', focusedPackId: 'one', collected: ['b'] }), { type: 'TEAR_COMPLETE' });
    expect(next.queue).toEqual(['a', 'c']);
  });

  it('a pack with nothing left to draw is complete the moment it tears', () => {
    const state = at({ phase: 'pack-focused', focusedPackId: 'two', collected: ['d', 'e'] });
    const next = run(state, { type: 'TEAR_COMPLETE' });
    expect(next).toMatchObject({ phase: 'pack-complete', openedPacks: ['two'], queue: [] });
  });

  it('tearing without a focused pack does nothing', () => {
    const broken = at({ phase: 'pack-focused' });
    expect(run(broken, { type: 'TEAR_COMPLETE' })).toBe(broken);
  });
});

describe('cards', () => {
  it('DRAW_CARD pops the top of the queue onto the stage', () => {
    expect(onStage).toMatchObject({ phase: 'card-on-stage', stageCardId: 'a', queue: ['b', 'c'], seenRare: false });
  });

  it('DRAW_CARD with an empty queue does nothing', () => {
    const empty = at({ phase: 'revealing', focusedPackId: 'one' });
    expect(run(empty, DRAW)).toBe(empty);
    expect(run(complete, DRAW)).toBe(complete);
  });

  it('seenRare is set by the first rare and stays set', () => {
    const rareOnStage = run(onStageSecond, COLLECT, DRAW);
    expect(rareOnStage).toMatchObject({ stageCardId: 'c', seenRare: true });
    expect(boxOpenAfterOne.seenRare).toBe(true);
    const next = run(boxOpenAfterOne, { type: 'FOCUS_PACK', packId: 'two' }, { type: 'TEAR_COMPLETE' }, DRAW);
    expect(next).toMatchObject({ stageCardId: 'd', seenRare: true });
  });

  it('a holo sets seenRare too; an id without a card does not', () => {
    expect(contactOnStage.seenRare).toBe(true);
    const holoFirst = run(at({ phase: 'all-collected', queue: ['contact'] }), DRAW);
    expect(holoFirst.seenRare).toBe(true);
    expect(run(at({ phase: 'revealing', queue: ['ghost'] }), DRAW).seenRare).toBe(false);
  });

  it('COLLECT_CARD with cards left: binder grows, back to revealing', () => {
    expect(revealingSecond).toMatchObject({
      phase: 'revealing',
      collected: ['a'],
      stageCardId: null,
      queue: ['b', 'c'],
      openedPacks: [],
    });
  });

  it('COLLECT_CARD on the last card: pack-complete and the pack is opened', () => {
    expect(packComplete).toMatchObject({
      phase: 'pack-complete',
      collected: ['a', 'b', 'c'],
      openedPacks: ['one'],
      focusedPackId: 'one',
      stageCardId: null,
    });
  });

  it('COLLECT_CARD never duplicates a card or a pack', () => {
    const state = at({
      phase: 'card-on-stage',
      focusedPackId: 'one',
      stageCardId: 'a',
      collected: ['a'],
      openedPacks: ['one'],
    });
    expect(run(state, COLLECT)).toMatchObject({ collected: ['a'], openedPacks: ['one'], phase: 'pack-complete' });
  });

  it('COLLECT_CARD needs a stage card; without a focused pack no pack is opened', () => {
    const empty = at({ phase: 'card-on-stage' });
    expect(run(empty, COLLECT)).toBe(empty);
    const orphan = run(at({ phase: 'card-on-stage', stageCardId: 'a' }), COLLECT);
    expect(orphan).toMatchObject({ phase: 'pack-complete', collected: ['a'], openedPacks: [] });
  });
});

describe('detail', () => {
  it('OPEN_DETAIL from the stage shows the stage card', () => {
    expect(stageDetail).toMatchObject({
      phase: 'card-detail',
      detailCardId: 'a',
      stageCardId: 'a',
      returnPhase: 'card-on-stage',
    });
    expect(run(onStage, { type: 'OPEN_DETAIL', cardId: 'a' })).toEqual(stageDetail);
  });

  it('CLOSE_DETAIL returns to where it was opened', () => {
    expect(run(stageDetail, { type: 'CLOSE_DETAIL' })).toEqual(onStage);
    expect(run(binderDetail, { type: 'CLOSE_DETAIL' })).toEqual(revealingSecond);
  });

  it('CLOSE_DETAIL without a return phase falls back to the shelf', () => {
    expect(run(at({ phase: 'card-detail', detailCardId: 'a' }), { type: 'CLOSE_DETAIL' })).toMatchObject({
      phase: 'box-open',
      detailCardId: null,
    });
  });

  it('OPEN_DETAIL without a card id only works on the stage', () => {
    expect(run(revealingSecond, { type: 'OPEN_DETAIL' })).toBe(revealingSecond);
    const noCard = at({ phase: 'card-on-stage' });
    expect(run(noCard, { type: 'OPEN_DETAIL' })).toBe(noCard);
  });

  it('OPEN_DETAIL with a card id needs that card in the binder', () => {
    expect(run(revealingSecond, { type: 'OPEN_DETAIL', cardId: 'b' })).toBe(revealingSecond);
    expect(run(onStageSecond, { type: 'OPEN_DETAIL', cardId: 'c' })).toBe(onStageSecond);
  });

  it('a binder card opens from every resting phase and returns there', () => {
    const phases: Phase[] = ['sealed', 'box-open', 'pack-focused', 'revealing', 'card-on-stage', 'pack-complete', 'all-collected'];
    for (const phase of phases) {
      const from = at({ phase, collected: ['a'], stageCardId: phase === 'card-on-stage' ? 'b' : null });
      const open = run(from, { type: 'OPEN_DETAIL', cardId: 'a' });
      expect(open).toMatchObject({ phase: 'card-detail', detailCardId: 'a', returnPhase: phase });
      expect(run(open, { type: 'CLOSE_DETAIL' })).toEqual(from);
    }
  });

  it('opening detail settles a relaxing hold', () => {
    const relaxing = { ...packRelaxing, collected: ['d'] };
    expect(run(relaxing, { type: 'OPEN_DETAIL', cardId: 'd' })).toMatchObject({
      phase: 'card-detail',
      returnPhase: 'pack-focused',
      holdProgress: 0,
      holdDirection: 'idle',
      holdTarget: null,
    });
  });

  it('COLLECT_CARD from the detail of the stage card', () => {
    expect(run(stageDetail, COLLECT)).toEqual(revealingSecond);
  });

  it('COLLECT_CARD from the detail of a binder card does nothing', () => {
    const binderOverStage = run(onStageSecond, { type: 'OPEN_DETAIL', cardId: 'a' });
    expect(binderOverStage).toMatchObject({ phase: 'card-detail', detailCardId: 'a', stageCardId: 'b' });
    expect(run(binderOverStage, COLLECT)).toBe(binderOverStage);
    expect(run(binderDetail, COLLECT)).toBe(binderDetail);
  });
});

describe('finishing', () => {
  it('DISMISS_PACK: back to the shelf while packs remain', () => {
    expect(boxOpenAfterOne).toMatchObject({ phase: 'box-open', focusedPackId: null, openedPacks: ['one'], queue: [] });
  });

  it('DISMISS_PACK after the last pack: all-collected with the contact card queued', () => {
    expect(allCollected).toMatchObject({
      phase: 'all-collected',
      focusedPackId: null,
      queue: ['contact'],
      openedPacks: ['one', 'two'],
      collected: ['a', 'b', 'c', 'd', 'e'],
    });
  });

  it('the contact card is not queued twice', () => {
    const state = at({ phase: 'pack-complete', focusedPackId: 'two', openedPacks: ['one', 'two'], collected: ['contact'] });
    expect(run(state, { type: 'DISMISS_PACK' })).toMatchObject({ phase: 'all-collected', queue: [] });
  });

  it('the contact card is drawn, read and collected like any card, ending in all-collected', () => {
    expect(contactOnStage).toMatchObject({ phase: 'card-on-stage', stageCardId: 'contact', queue: [] });
    const viaDetail = run(contactOnStage, { type: 'OPEN_DETAIL' }, COLLECT);
    expect(viaDetail).toEqual(complete);
    expect(complete).toMatchObject({
      phase: 'all-collected',
      stageCardId: null,
      queue: [],
      collected: ['a', 'b', 'c', 'd', 'e', 'contact'],
      openedPacks: ['one', 'two'],
    });
    expect(isComplete(complete, bundle)).toBe(true);
    expect(isComplete(allCollected, bundle)).toBe(false);
  });
});

describe('reset', () => {
  it('RESET: resetting, the binder stays for the fade, everything else is cleared', () => {
    expect(resetting).toMatchObject({
      phase: 'resetting',
      collected: complete.collected,
      openedPacks: complete.openedPacks,
      queue: [],
      stageCardId: null,
      detailCardId: null,
      returnPhase: null,
      focusedPackId: null,
    });
  });

  it('RESET works from every phase except while holding or already resetting', () => {
    for (const from of [sealed, sealedRelaxing, boxOpen, packFocused, packRelaxing, revealing, onStage, stageDetail, packComplete, allCollected]) {
      expect(run(from, { type: 'RESET' })).toMatchObject({
        phase: 'resetting',
        holdProgress: 0,
        holdDirection: 'idle',
        holdTarget: null,
        stageCardId: null,
        detailCardId: null,
      });
    }
    for (const from of [unwrapping, packTearing, resetting]) {
      expect(run(from, { type: 'RESET' })).toBe(from);
    }
  });

  it('RESET_DONE: a fresh initial state', () => {
    expect(run(resetting, { type: 'RESET_DONE' })).toEqual(initialState());
  });
});

describe('HYDRATE', () => {
  const hydrate = (collected: string[], openedPacks: string[]): ExperienceState =>
    run(sealed, { type: 'HYDRATE', collected, openedPacks });

  it('nothing stored: the same sealed state', () => {
    expect(hydrate([], [])).toBe(sealed);
    expect(hydrate(['ghost'], ['nope'])).toBe(sealed);
  });

  it('one finished pack: box-open', () => {
    expect(hydrate(['a', 'b', 'c'], ['one'])).toMatchObject({
      phase: 'box-open',
      collected: ['a', 'b', 'c'],
      openedPacks: ['one'],
      queue: [],
      seenRare: true,
    });
  });

  it('a partial pack is not opened; its cards stay and are skipped when it is torn again', () => {
    const state = hydrate(['a', 'b', 'c', 'd'], ['one', 'two']);
    expect(state).toMatchObject({ phase: 'box-open', collected: ['a', 'b', 'c', 'd'], openedPacks: ['one'] });
    const torn = run(state, { type: 'FOCUS_PACK', packId: 'two' }, { type: 'TEAR_COMPLETE' });
    expect(torn).toMatchObject({ phase: 'revealing', queue: ['e'] });
    expect(run(torn, DRAW, COLLECT)).toMatchObject({ phase: 'pack-complete', openedPacks: ['one', 'two'] });
  });

  it('only loose cards: box-open with no opened pack and no rare seen', () => {
    expect(hydrate(['a'], [])).toMatchObject({ phase: 'box-open', collected: ['a'], openedPacks: [], seenRare: false });
  });

  it('drops unknown and duplicate ids', () => {
    expect(hydrate(['a', 'ghost', 'a', 'b', 'c'], ['one', 'nope', 'one'])).toMatchObject({
      collected: ['a', 'b', 'c'],
      openedPacks: ['one'],
    });
  });

  it('a fully collected pack counts as opened even when it was not stored as such', () => {
    expect(hydrate(['d', 'e', 'a', 'b', 'c'], ['two'])).toMatchObject({ openedPacks: ['two', 'one'] });
  });

  it('keeps the stored open order', () => {
    expect(hydrate(['a', 'b', 'c', 'd', 'e'], ['two', 'one']).openedPacks).toEqual(['two', 'one']);
  });

  it('all packs opened: all-collected with the contact card queued', () => {
    expect(hydrate(['a', 'b', 'c', 'd', 'e'], ['one', 'two'])).toMatchObject({
      phase: 'all-collected',
      queue: ['contact'],
    });
  });

  it('complete: all-collected, nothing queued', () => {
    const state = hydrate(['a', 'b', 'c', 'd', 'e', 'contact'], ['one', 'two']);
    expect(state).toMatchObject({ phase: 'all-collected', queue: [], seenRare: true });
    expect(isComplete(state, bundle)).toBe(true);
  });

  it('is ignored once a hold has started moving', () => {
    const action: Action = { type: 'HYDRATE', collected: ['a'], openedPacks: [] };
    expect(run(sealedRelaxing, action)).toBe(sealedRelaxing);
    expect(run(unwrapping, action)).toBe(unwrapping);
    expect(run(boxOpen, action)).toBe(boxOpen);
  });

  it('a pack without cards is opened only when it was stored as opened', () => {
    const parts = makeParts();
    const withEmpty = createBundle({ ...parts, packs: [...parts.packs, makePack('empty', [])] });
    const r = createReducer({ ...ctx, bundle: withEmpty });
    const stored: Action = { type: 'HYDRATE', collected: ['a'], openedPacks: ['empty'] };
    expect(r(sealed, stored).openedPacks).toEqual(['empty']);
    expect(r(sealed, { type: 'HYDRATE', collected: ['a'], openedPacks: [] }).openedPacks).toEqual([]);
    // tearing it: nothing to draw, straight to pack-complete
    const torn = [{ type: 'TEAR_COMPLETE' }, { type: 'FOCUS_PACK', packId: 'empty' }, { type: 'TEAR_COMPLETE' }] as const;
    expect(torn.reduce<ExperienceState>(r, sealed)).toMatchObject({ phase: 'pack-complete', openedPacks: ['empty'] });
  });
});

describe('validity table', () => {
  /** Several states per phase, so guards cannot hide behind one lucky sample. */
  const samples: Record<Phase, ExperienceState[]> = {
    sealed: [sealed, sealedRelaxing, at({ collected: ['a'] })],
    unwrapping: [unwrapping, run(sealed, { type: 'HOLD_START' })],
    'box-open': [boxOpen, boxOpenAfterOne],
    'pack-focused': [packFocused, packRelaxing, run(boxOpenAfterOne, { type: 'FOCUS_PACK', packId: 'two' })],
    'pack-tearing': [packTearing, run(packFocused, { type: 'HOLD_START' })],
    revealing: [revealing, revealingSecond],
    'card-on-stage': [onStage, onStageSecond, contactOnStage],
    'card-detail': [stageDetail, binderDetail],
    'pack-complete': [packComplete],
    'all-collected': [allCollected, complete],
    resetting: [resetting],
  };

  const actions: Action[] = [
    { type: 'HOLD_START' },
    { type: 'HOLD_TICK', dtMs: 16 },
    { type: 'HOLD_TICK', dtMs: 5000 },
    { type: 'HOLD_END' },
    { type: 'TEAR_COMPLETE' },
    { type: 'FOCUS_PACK', packId: 'one' },
    { type: 'FOCUS_PACK', packId: 'two' },
    { type: 'UNFOCUS_PACK' },
    { type: 'DRAW_CARD' },
    { type: 'OPEN_DETAIL' },
    { type: 'OPEN_DETAIL', cardId: 'a' },
    { type: 'CLOSE_DETAIL' },
    { type: 'COLLECT_CARD' },
    { type: 'DISMISS_PACK' },
    { type: 'RESET' },
    { type: 'RESET_DONE' },
    { type: 'HYDRATE', collected: ['a', 'b', 'c'], openedPacks: ['one'] },
  ];

  it('covers every phase and every action type', () => {
    expect(Object.keys(VALID_ACTIONS).sort()).toEqual([...PHASES].sort());
    expect([...new Set(actions.map((action) => action.type))].sort()).toEqual([...ACTION_TYPES].sort());
    for (const phase of PHASES) {
      expect(samples[phase].length).toBeGreaterThan(0);
      for (const sample of samples[phase]) expect(sample.phase).toBe(phase);
      for (const type of VALID_ACTIONS[phase]) expect(ACTION_TYPES).toContain(type);
    }
  });

  const pairs = PHASES.flatMap((phase) => ACTION_TYPES.map((type) => ({ phase, type })));

  it.each(pairs.filter(({ phase, type }) => !VALID_ACTIONS[phase].includes(type)))(
    '$phase ignores $type (same reference)',
    ({ phase, type }) => {
      for (const sample of samples[phase]) {
        const snapshot = structuredClone(sample);
        for (const action of actions.filter((candidate) => candidate.type === type)) {
          expect(reducer(sample, action, ctx)).toBe(sample);
        }
        expect(sample).toEqual(snapshot);
      }
    },
  );

  it.each(pairs.filter(({ phase, type }) => VALID_ACTIONS[phase].includes(type)))(
    '$phase accepts $type (some sample changes, none is mutated)',
    ({ phase, type }) => {
      let changed = false;
      for (const sample of samples[phase]) {
        const snapshot = structuredClone(sample);
        for (const action of actions.filter((candidate) => candidate.type === type)) {
          if (reducer(sample, action, ctx) !== sample) changed = true;
        }
        expect(sample).toEqual(snapshot);
      }
      expect(changed).toBe(true);
    },
  );

  it('the table itself (documented in INTERACTION-SPEC)', () => {
    expect(VALID_ACTIONS).toEqual({
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
    });
  });
});

describe('full run over the real placeholder content', () => {
  const modules = import.meta.glob<{ default: Card }>('/content/cards/*.ts', { eager: true });
  const cards = Object.entries(modules)
    .filter(([path]) => !path.split('/').pop()!.startsWith('_'))
    .map(([, module]) => module.default);
  const real = createBundle({ packs: packsContent, cards, meta: metaContent, strings: { en, nl } });
  const r = createReducer({ bundle: real, holdDurationMs: 900, cancelReturnMs: 260 });

  /** Hold with 16 ms frames until the phase changes. */
  function holdThrough(start: ExperienceState): ExperienceState {
    let state = r(start, { type: 'HOLD_START' });
    const holding = state.phase;
    let frames = 0;
    while (state.phase === holding) {
      state = r(state, tick(16));
      frames += 1;
      expect(frames).toBeLessThan(100);
    }
    // a resumed hold (after an early release) needs fewer frames, never more
    expect(frames).toBeLessThanOrEqual(Math.ceil(900 / 16));
    return state;
  }

  it('sealed → complete: every card collected in authored order, packs in open order', () => {
    expect(cards).toHaveLength(16);
    expect(totalCards(real)).toBe(16);

    let state = holdThrough(initialState());
    expect(state.phase).toBe('box-open');

    // not shelf order, to prove openedPacks follows the order of opening
    const order = ['craft', 'personality', 'track-record', 'table'];
    expect([...order].sort()).toEqual(real.packs.map((pack) => pack.id).sort());

    const expected: string[] = [];
    for (const [index, packId] of order.entries()) {
      const pack = real.packs.find((candidate) => candidate.id === packId)!;
      state = r(state, { type: 'FOCUS_PACK', packId });
      expect(state.phase).toBe('pack-focused');
      // one aborted attempt on the first pack, then the real tear
      if (index === 0) {
        state = r(r(r(state, { type: 'HOLD_START' }), tick(300)), { type: 'HOLD_END' });
        expect(state).toMatchObject({ phase: 'pack-focused', holdDirection: 'down', lastHoldCancelledAt: 1 });
      }
      state = holdThrough(state);
      expect(state).toMatchObject({ phase: 'revealing', queue: pack.cards });

      for (const [position, cardId] of pack.cards.entries()) {
        state = r(state, DRAW);
        expect(state).toMatchObject({ phase: 'card-on-stage', stageCardId: cardId });
        // read every other card before collecting it
        if (position % 2 === 1) {
          state = r(state, { type: 'OPEN_DETAIL' });
          expect(state).toMatchObject({ phase: 'card-detail', detailCardId: cardId });
        }
        state = r(state, COLLECT);
        expected.push(cardId);
        expect(state.collected).toEqual(expected);
      }
      expect(state).toMatchObject({ phase: 'pack-complete', openedPacks: order.slice(0, index + 1) });
      expect(r(state, { type: 'FOCUS_PACK', packId })).toBe(state);
      state = r(state, { type: 'DISMISS_PACK' });
      expect(state.phase).toBe(index === order.length - 1 ? 'all-collected' : 'box-open');
    }

    expect(state.collected).toHaveLength(totalCards(real));
    expect(isComplete(state, real)).toBe(false);
    expect(state.queue).toEqual([real.meta.contactCard.id]);

    state = r(state, DRAW);
    expect(state).toMatchObject({ phase: 'card-on-stage', stageCardId: real.meta.contactCard.id });
    state = r(state, COLLECT);

    expect(state.phase).toBe('all-collected');
    expect(state.collected).toHaveLength(17);
    expect(state.collected).toHaveLength(totalWithContact(real));
    expect(new Set(state.collected).size).toBe(17);
    expect(state.collected).toEqual([...expected, real.meta.contactCard.id]);
    expect(state.openedPacks).toEqual(order);
    expect(state.seenRare).toBe(true);
    expect(isComplete(state, real)).toBe(true);

    // what persistence would store brings the same binder back
    const restored = r(initialState(), {
      type: 'HYDRATE',
      collected: state.collected,
      openedPacks: state.openedPacks,
    });
    expect(restored).toMatchObject({
      phase: 'all-collected',
      collected: state.collected,
      openedPacks: order,
      queue: [],
    });

    // and the wrap goes back on
    expect(r(r(state, { type: 'RESET' }), { type: 'RESET_DONE' })).toEqual(initialState());
  });

  it('a pack-less bundle is still a valid machine', () => {
    const none = createBundle({ packs: [], cards: [], meta: makeMeta(), strings: { en, nl } });
    const rr = createReducer({ ...ctx, bundle: none });
    expect(rr(initialState(), { type: 'HYDRATE', collected: [], openedPacks: [] }).phase).toBe('sealed');
    expect(makeCard('x').rarity).toBe('common');
  });
});
