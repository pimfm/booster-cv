import { describe, expect, it } from 'vitest';
import { createBundle } from '@/content/bundle';
import { makeParts } from '@/content/testkit';
import { initialState } from './reducer';
import {
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
import type { ExperienceState } from './types';

const bundle = createBundle(makeParts());
const at = (overrides: Partial<ExperienceState>): ExperienceState => ({ ...initialState(), ...overrides });

describe('holdVisual', () => {
  it('is at rest for p = 0', () => {
    expect(holdVisual(0)).toEqual({
      curved: 0,
      scaleBox: 1,
      scalePack: 1,
      skewPackDeg: -0,
      seamOpacity: 0.4,
      seamWidth: 0,
      tabRotateDeg: -0,
      tabLiftPx: -0,
      contentShiftPx: 0,
    });
  });

  it('reaches the INTERACTION-SPEC §1/§3 end values for p = 1', () => {
    const v = holdVisual(1);
    expect(v.curved).toBe(1);
    expect(v.scaleBox).toBeCloseTo(0.97, 10);
    expect(v.scalePack).toBeCloseTo(0.96, 10);
    expect(v.skewPackDeg).toBeCloseTo(-1.5, 10);
    expect(v.seamOpacity).toBeCloseTo(1, 10);
    expect(v.seamWidth).toBe(1);
    expect(v.tabRotateDeg).toBeCloseTo(-18, 10);
    expect(v.tabLiftPx).toBeCloseTo(-6, 10);
    expect(v.contentShiftPx).toBeCloseTo(2, 10);
  });

  it('applies holdCurve to linear progress, and clamps', () => {
    expect(holdVisual(0.7).curved).toBeCloseTo(0.56, 10);
    expect(holdVisual(0.7).scaleBox).toBeCloseTo(1 - 0.03 * 0.56, 10);
    expect(holdVisual(5)).toEqual(holdVisual(1));
    expect(holdVisual(-5)).toEqual(holdVisual(0));
  });
});

describe('state selectors', () => {
  it('isHolding is true only while pressed', () => {
    expect(isHolding(at({ holdDirection: 'up' }))).toBe(true);
    expect(isHolding(at({ holdDirection: 'down' }))).toBe(false);
    expect(isHolding(at({}))).toBe(false);
  });

  it('progressByPack follows shelf order', () => {
    expect(progressByPack(at({ collected: ['a', 'c', 'e', 'contact'] }), bundle)).toEqual([
      { packId: 'one', collected: 2, total: 3 },
      { packId: 'two', collected: 1, total: 2 },
    ]);
  });

  it('remainingInPack counts uncollected cards of the focused or a given pack', () => {
    const state = at({ focusedPackId: 'one', collected: ['a'] });
    expect(remainingInPack(state, bundle)).toBe(2);
    expect(remainingInPack(state, bundle, 'two')).toBe(2);
    expect(remainingInPack(state, bundle, 'nope')).toBe(0);
    expect(remainingInPack(at({}), bundle)).toBe(0);
  });

  it('counts include the contact card', () => {
    expect(totalCount(bundle)).toBe(6);
    const five = at({ collected: ['a', 'b', 'c', 'd', 'e'] });
    expect(collectedCount(five)).toBe(5);
    expect(isComplete(five, bundle)).toBe(false);
    expect(isComplete(at({ collected: [...five.collected, 'contact'] }), bundle)).toBe(true);
  });

  it('stageCard / detailCard resolve cards, the contact card included', () => {
    expect(stageCard(at({}), bundle)).toBeNull();
    expect(stageCard(at({ stageCardId: 'a' }), bundle)?.id).toBe('a');
    expect(stageCard(at({ stageCardId: 'contact' }), bundle)?.kind).toBe('contact');
    expect(stageCard(at({ stageCardId: 'ghost' }), bundle)).toBeNull();
    expect(detailCard(at({}), bundle)).toBeNull();
    expect(detailCard(at({ detailCardId: 'd' }), bundle)?.id).toBe('d');
  });

  it('isPackOpened / focusedPack', () => {
    const state = at({ openedPacks: ['one'], focusedPackId: 'two' });
    expect(isPackOpened(state, 'one')).toBe(true);
    expect(isPackOpened(state, 'two')).toBe(false);
    expect(focusedPack(state, bundle)?.id).toBe('two');
    expect(focusedPack(at({}), bundle)).toBeNull();
    expect(focusedPack(at({ focusedPackId: 'nope' }), bundle)).toBeNull();
  });
});
