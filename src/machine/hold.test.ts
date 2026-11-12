import { describe, expect, it } from 'vitest';
import { hold } from '@/design/motion';
import { advanceHold, crossedMark, holdCurve, relaxHold } from './hold';

/** Deterministic pseudo-random numbers in [0, 1) (mulberry32). */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('holdCurve', () => {
  it('maps 0 → 0 and 1 → 1 exactly', () => {
    expect(holdCurve(0)).toBe(0);
    expect(holdCurve(1)).toBe(1);
  });

  it('follows the piecewise definition of INTERACTION-SPEC §1', () => {
    expect(holdCurve(0.35)).toBeCloseTo(0.35 * 0.8, 10);
    expect(holdCurve(0.7)).toBeCloseTo(0.56, 10);
    expect(holdCurve(0.85)).toBeCloseTo(0.56 + 0.15 * 1.4667, 4);
  });

  it('is monotonic and stays in 0..1 (sampled)', () => {
    let prev = holdCurve(0);
    for (let i = 1; i <= 2000; i += 1) {
      const value = holdCurve(i / 2000);
      expect(value).toBeGreaterThanOrEqual(prev);
      expect(value).toBeLessThanOrEqual(1);
      prev = value;
    }
  });

  it('is continuous at the knee (0.7)', () => {
    const eps = 1e-9;
    expect(Math.abs(holdCurve(0.7 + eps) - holdCurve(0.7 - eps))).toBeLessThan(1e-8);
  });

  it('is slow first, quick at the end', () => {
    const early = holdCurve(0.2) - holdCurve(0.1);
    const late = holdCurve(0.9) - holdCurve(0.8);
    expect(late).toBeGreaterThan(early);
  });

  it('clamps out-of-range and non-numeric input', () => {
    expect(holdCurve(-1)).toBe(0);
    expect(holdCurve(2)).toBe(1);
    expect(holdCurve(Number.NaN)).toBe(0);
  });
});

describe('advanceHold', () => {
  it('reaches 1 after exactly the duration', () => {
    expect(advanceHold(0, 450, 900)).toBeCloseTo(0.5, 10);
    expect(advanceHold(0.5, 450, 900)).toBe(1);
    expect(advanceHold(0, 900, 900)).toBe(1);
  });

  it('defaults to hold.durationMs', () => {
    expect(advanceHold(0, hold.durationMs / 4)).toBeCloseTo(0.25, 10);
  });

  it('takes duration / 16 frames of 16 ms', () => {
    let p = 0;
    let frames = 0;
    while (p < 1) {
      p = advanceHold(p, 16, 900);
      frames += 1;
    }
    expect(frames).toBe(Math.ceil(900 / 16));
  });

  it('clamps and ignores non-positive or NaN time steps', () => {
    expect(advanceHold(0.4, 5000, 900)).toBe(1);
    expect(advanceHold(0.4, 0, 900)).toBe(0.4);
    expect(advanceHold(0.4, -16, 900)).toBe(0.4);
    expect(advanceHold(0.4, Number.NaN, 900)).toBe(0.4);
    expect(advanceHold(-3, 0, 900)).toBe(0);
    expect(advanceHold(7, 0, 900)).toBe(1);
  });

  it('completes at once for a non-positive duration', () => {
    expect(advanceHold(0, 1, 0)).toBe(1);
    expect(advanceHold(0, 1, -5)).toBe(1);
  });
});

describe('relaxHold', () => {
  it('takes returnMs for a full 1 → 0', () => {
    expect(relaxHold(1, 130, 260)).toBeCloseTo(0.5, 10);
    expect(relaxHold(1, 260, 260)).toBe(0);
    expect(relaxHold(0.5, 130, 260)).toBe(0);
  });

  it('decays linearly: half the progress takes half the time', () => {
    expect(relaxHold(0.5, 65, 260)).toBeCloseTo(0.25, 10);
  });

  it('defaults to hold.cancelReturnMs', () => {
    expect(relaxHold(1, hold.cancelReturnMs / 2)).toBeCloseTo(0.5, 10);
  });

  it('clamps and ignores non-positive or NaN time steps', () => {
    expect(relaxHold(0.2, 5000, 260)).toBe(0);
    expect(relaxHold(0.2, 0, 260)).toBe(0.2);
    expect(relaxHold(0.2, -16, 260)).toBe(0.2);
    expect(relaxHold(0.2, Number.NaN, 260)).toBe(0.2);
    expect(relaxHold(4, 0, 260)).toBe(1);
  });

  it('snaps to 0 for a non-positive return time', () => {
    expect(relaxHold(0.9, 1, 0)).toBe(0);
  });
});

describe('crossedMark', () => {
  const marks = hold.thresholdHaptic;

  it('returns the mark in (prev, next]', () => {
    expect(crossedMark(0.3, 0.34, marks)).toBe(0.33);
    expect(crossedMark(0.3, 0.33, marks)).toBe(0.33);
    expect(crossedMark(0.6, 0.7, marks)).toBe(0.66);
  });

  it('returns null when nothing is crossed', () => {
    expect(crossedMark(0, 0.2, marks)).toBeNull();
    expect(crossedMark(0.33, 0.4, marks)).toBeNull(); // prev already on the mark
    expect(crossedMark(0.4, 0.4, marks)).toBeNull();
    expect(crossedMark(0.5, 0.2, marks)).toBeNull(); // going down never fires
    expect(crossedMark(0, 1, [])).toBeNull();
  });

  it('returns the highest mark when one step crosses several, in any mark order', () => {
    expect(crossedMark(0, 1, marks)).toBe(0.66);
    expect(crossedMark(0, 1, [0.66, 0.33])).toBe(0.66);
  });

  it('fires each mark exactly once over a hold with random frame times', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const random = rng(seed);
      const fired: number[] = [];
      let p = 0;
      while (p < 1) {
        const next = advanceHold(p, 4 + random() * 60, 900);
        const mark = crossedMark(p, next, marks);
        if (mark !== null) fired.push(mark);
        p = next;
      }
      expect(fired).toEqual([0.33, 0.66]);
    }
  });
});
