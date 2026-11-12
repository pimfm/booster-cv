import { afterEach, describe, expect, it, vi } from 'vitest';
import { dur, ease, getDur, getSpring, hold, holdDurationMs, reducedTransition, spring } from './motion';

afterEach(() => {
  delete window.__BOOSTER_HOLD_MS__;
  delete window.__MOTION_OVERRIDES__;
  vi.unstubAllEnvs();
});

describe('motion tokens', () => {
  it('exports the DESIGN-BRIEF §3 values', () => {
    expect(dur).toEqual({ xs: 0.12, sm: 0.2, md: 0.32, lg: 0.5, xl: 0.8 });
    expect(ease).toEqual({
      out: [0.16, 1, 0.3, 1],
      inOut: [0.65, 0, 0.35, 1],
      in: [0.7, 0, 0.84, 0],
    });
    expect(Object.keys(spring)).toEqual(['settle', 'card', 'pack', 'lid']);
    for (const s of Object.values(spring)) {
      expect(s.type).toBe('spring');
      expect(s.stiffness).toBeGreaterThan(0);
      expect(s.damping).toBeGreaterThan(0);
      expect(s.mass).toBeGreaterThan(0);
    }
    expect(spring.card).toEqual({ type: 'spring', stiffness: 260, damping: 28, mass: 1.1 });
    expect(hold).toEqual({ durationMs: 900, cancelReturnMs: 260, thresholdHaptic: [0.33, 0.66] });
    expect(reducedTransition).toEqual({ duration: 0.01 });
  });

  it('bigger things move slower (weight ordering)', () => {
    expect(spring.settle.stiffness).toBeGreaterThan(spring.card.stiffness);
    expect(spring.card.stiffness).toBeGreaterThan(spring.pack.stiffness);
    expect(spring.pack.stiffness).toBeGreaterThan(spring.lid.stiffness);
  });
});

describe('holdDurationMs', () => {
  it('returns 900 by default', () => {
    expect(holdDurationMs()).toBe(900);
  });

  it('returns the window override in test mode', () => {
    window.__BOOSTER_HOLD_MS__ = 50;
    expect(holdDurationMs()).toBe(50);
  });

  it('ignores a non-numeric override', () => {
    (window as unknown as { __BOOSTER_HOLD_MS__: unknown }).__BOOSTER_HOLD_MS__ = '50';
    expect(holdDurationMs()).toBe(900);
  });

  it('ignores the override in production', () => {
    vi.stubEnv('MODE', 'production');
    window.__BOOSTER_HOLD_MS__ = 50;
    expect(holdDurationMs()).toBe(900);
  });
});

describe('getSpring / getDur', () => {
  it('return the constants without overrides', () => {
    expect(getSpring('card')).toBe(spring.card);
    expect(getDur('md')).toBe(dur.md);
  });

  it('shallow-merge window.__MOTION_OVERRIDES__ per group', () => {
    window.__MOTION_OVERRIDES__ = { spring: { card: { stiffness: 300 } }, dur: { md: 1 } };
    expect(getSpring('card')).toEqual({ type: 'spring', stiffness: 300, damping: 28, mass: 1.1 });
    expect(getSpring('lid')).toBe(spring.lid);
    expect(getDur('md')).toBe(1);
    expect(getDur('sm')).toBe(dur.sm);
  });

  it('ignore overrides in production', () => {
    vi.stubEnv('MODE', 'production');
    window.__MOTION_OVERRIDES__ = { spring: { card: { stiffness: 300 } }, dur: { md: 1 } };
    expect(getSpring('card')).toBe(spring.card);
    expect(getDur('md')).toBe(dur.md);
  });
});
