import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dur, spring } from './motion';
import { REDUCED_MOTION_QUERY, useMotionPrefs } from './useMotionPrefs';

const originalMatchMedia = window.matchMedia;

/** Installs a controllable matchMedia; returns a setter that fires `change`. */
function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const queries: string[] = [];
  window.matchMedia = vi.fn((query: string) => {
    queries.push(query);
    return {
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_type: string, cb: () => void) => listeners.delete(cb),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });
  return {
    queries,
    listenerCount: () => listeners.size,
    set(next: boolean) {
      matches = next;
      listeners.forEach((cb) => cb());
    },
  };
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  delete window.__MOTION_OVERRIDES__;
});

describe('useMotionPrefs', () => {
  it('reduce → reduced, near-zero spring and dur', () => {
    const mm = mockMatchMedia(true);
    const { result } = renderHook(() => useMotionPrefs());
    expect(mm.queries).toContain(REDUCED_MOTION_QUERY);
    expect(result.current.reduced).toBe(true);
    expect(result.current.spring('card')).toEqual({ duration: 0.01 });
    expect(result.current.spring('lid')).toEqual({ duration: 0.01 });
    expect(result.current.dur('lg')).toBe(0.01);
  });

  it('no preference → real spring config and duration', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useMotionPrefs());
    expect(result.current.reduced).toBe(false);
    expect(result.current.spring('card')).toEqual(spring.card);
    expect(result.current.dur('lg')).toBe(dur.lg);
  });

  it('reacts to the media query changing and unsubscribes on unmount', () => {
    const mm = mockMatchMedia(false);
    const { result, unmount } = renderHook(() => useMotionPrefs());
    expect(result.current.reduced).toBe(false);
    act(() => mm.set(true));
    expect(result.current.reduced).toBe(true);
    expect(result.current.spring('pack')).toEqual({ duration: 0.01 });
    act(() => mm.set(false));
    expect(result.current.spring('pack')).toEqual(spring.pack);
    unmount();
    expect(mm.listenerCount()).toBe(0);
  });

  it('honours dev/test motion overrides when not reduced', () => {
    mockMatchMedia(false);
    window.__MOTION_OVERRIDES__ = { spring: { card: { damping: 40 } } };
    const { result } = renderHook(() => useMotionPrefs());
    expect(result.current.spring('card')).toEqual({ ...spring.card, damping: 40 });
  });
});
