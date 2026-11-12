import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBundle } from '@/content/bundle';
import { makeParts } from '@/content/testkit';
import { hold } from '@/design/motion';
import { ExperienceProvider } from './ExperienceProvider';
import type { Action, ExperienceState } from './types';
import { useExperience, useExperienceSelector, useHoldProgress } from './useExperience';
import { collectedCount } from './selectors';

const bundle = createBundle(makeParts());

const BUTTONS: Record<string, Action> = {
  start: { type: 'HOLD_START' },
  end: { type: 'HOLD_END' },
  focus: { type: 'FOCUS_PACK', packId: 'one' },
};

/** Shows the state as text and offers the actions as buttons. */
function Probe() {
  const { state, dispatch, bundle: fromContext } = useExperience();
  const count = useExperienceSelector(collectedCount);
  return (
    <div>
      <output data-testid="state">{JSON.stringify(state)}</output>
      <output data-testid="count">{count}</output>
      <output data-testid="packs">{fromContext.packs.length}</output>
      {Object.entries(BUTTONS).map(([name, action]) => (
        <button key={name} type="button" onClick={() => dispatch(action)}>
          {name}
        </button>
      ))}
    </div>
  );
}

/** Reads only the motion value: must not re-render while the hold runs. */
function MotionProbe({ onRender, onChange }: { onRender: () => void; onChange: (value: number) => void }) {
  const progress = useHoldProgress();
  onRender();
  return (
    <button type="button" onClick={() => onChange(progress.get())}>
      read
    </button>
  );
}

function current(): ExperienceState {
  return JSON.parse(screen.getByTestId('state').textContent ?? '') as ExperienceState;
}

function click(name: string): void {
  fireEvent.click(screen.getByRole('button', { name }));
}

/** Lets `ms` of fake time pass; the faked requestAnimationFrame fires every 16 ms. */
function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function setup(initial?: Partial<ExperienceState>) {
  const onRender = vi.fn();
  const values: number[] = [];
  const view = render(
    <ExperienceProvider bundle={bundle} {...(initial ? { initial } : {})}>
      <Probe />
      <MotionProbe onRender={onRender} onChange={(value) => values.push(value)} />
    </ExperienceProvider>,
  );
  const readProgress = (): number => {
    click('read');
    return values.at(-1) ?? Number.NaN;
  };
  return { ...view, onRender, readProgress };
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout', 'Date'],
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete window.__BOOSTER_HOLD_MS__;
});

describe('ExperienceProvider', () => {
  it('starts sealed and exposes state, bundle and selectors', () => {
    setup();
    expect(current()).toMatchObject({ phase: 'sealed', holdProgress: 0, holdDirection: 'idle' });
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('packs')).toHaveTextContent('2');
  });

  it('merges `initial` over the initial state', () => {
    const { readProgress } = setup({ phase: 'box-open', collected: ['a'] });
    expect(current()).toMatchObject({ phase: 'box-open', collected: ['a'], holdDirection: 'idle' });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(readProgress()).toBe(0);
  });

  it('holding for the hold duration opens the box', () => {
    const { readProgress } = setup();
    click('start');
    expect(current()).toMatchObject({ phase: 'unwrapping', holdDirection: 'up', holdTarget: 'box' });

    advance(hold.durationMs / 2);
    const halfway = current();
    expect(halfway.phase).toBe('unwrapping');
    expect(halfway.holdProgress).toBeGreaterThan(0.4);
    expect(halfway.holdProgress).toBeLessThan(0.6);
    expect(readProgress()).toBe(halfway.holdProgress);

    advance(hold.durationMs / 2 + 32);
    expect(current()).toMatchObject({ phase: 'box-open', holdProgress: 0, holdDirection: 'idle', holdTarget: null });
    expect(readProgress()).toBe(0);
  });

  it('does not run a frame loop while idle', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    setup();
    advance(200);
    expect(raf).not.toHaveBeenCalled();

    click('start');
    advance(hold.durationMs + 64);
    expect(current().phase).toBe('box-open');
    const calls = raf.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    advance(500);
    expect(raf.mock.calls.length).toBe(calls);
  });

  it('an early HOLD_END relaxes back to 0 and counts the cancel', () => {
    const { readProgress } = setup();
    click('start');
    advance(400);
    const held = current().holdProgress;
    expect(held).toBeGreaterThan(0.3);

    click('end');
    expect(current()).toMatchObject({ phase: 'sealed', holdDirection: 'down', lastHoldCancelledAt: 1 });

    advance(48);
    const relaxing = current();
    expect(relaxing.holdDirection).toBe('down');
    expect(relaxing.holdProgress).toBeLessThan(held);
    expect(relaxing.holdProgress).toBeGreaterThan(0);
    expect(readProgress()).toBe(relaxing.holdProgress);

    advance(hold.cancelReturnMs);
    expect(current()).toMatchObject({
      phase: 'sealed',
      holdProgress: 0,
      holdDirection: 'idle',
      holdTarget: null,
      lastHoldCancelledAt: 1,
    });
    expect(readProgress()).toBe(0);

    // and a second early release counts up
    click('start');
    advance(100);
    click('end');
    expect(current().lastHoldCancelledAt).toBe(2);
  });

  it('window blur cancels the hold', () => {
    setup();
    click('start');
    advance(300);
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(current()).toMatchObject({ phase: 'sealed', holdDirection: 'down', lastHoldCancelledAt: 1 });
    advance(hold.cancelReturnMs);
    expect(current()).toMatchObject({ holdProgress: 0, holdDirection: 'idle' });
  });

  it('a hidden page cancels the hold; becoming visible does not', () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    setup();
    click('start');
    advance(300);

    visibility.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(current().phase).toBe('unwrapping');

    visibility.mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(current()).toMatchObject({ phase: 'sealed', holdDirection: 'down', lastHoldCancelledAt: 1 });
  });

  it('blur without a hold changes nothing', () => {
    setup();
    const before = current();
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(current()).toEqual(before);
  });

  it('caps a long frame at 64 ms and ignores a frame from the past', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
    const frame = (now: number): void => {
      const callback = frames.shift();
      if (!callback) throw new Error('no frame was requested');
      act(() => callback(now));
    };
    setup();
    click('start');
    const start = performance.now();

    frame(start - 5); // a timestamp older than the start of the loop: dt 0
    expect(current().holdProgress).toBe(0);

    frame(start + 500); // a stalled frame
    expect(current().holdProgress).toBeCloseTo(64 / hold.durationMs, 10);

    frame(start + 516);
    expect(current().holdProgress).toBeCloseTo(80 / hold.durationMs, 10);
  });

  it('reads __BOOSTER_HOLD_MS__ at dispatch time, not at mount', () => {
    setup();
    window.__BOOSTER_HOLD_MS__ = 50;
    click('start');
    advance(50 + 32);
    expect(current().phase).toBe('box-open');
  });

  it('holds on a focused pack tear it open', () => {
    setup({ phase: 'box-open' });
    click('focus');
    expect(current()).toMatchObject({ phase: 'pack-focused', focusedPackId: 'one' });
    click('start');
    expect(current()).toMatchObject({ phase: 'pack-tearing', holdTarget: 'pack' });
    advance(hold.durationMs + 32);
    expect(current()).toMatchObject({ phase: 'revealing', queue: ['a', 'b', 'c'] });
  });

  it('consumers of only the motion value do not re-render during a hold', () => {
    const { onRender } = setup();
    const before = onRender.mock.calls.length;
    click('start');
    advance(hold.durationMs + 32);
    expect(current().phase).toBe('box-open');
    expect(onRender.mock.calls.length).toBe(before);
  });

  it('removes its listeners and stops the loop on unmount', () => {
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = setup();
    click('start');
    advance(100);
    unmount();
    expect(cancel).toHaveBeenCalled();
    expect(() => {
      window.dispatchEvent(new Event('blur'));
      vi.advanceTimersByTime(200);
    }).not.toThrow();
  });
});

describe('hooks outside the provider', () => {
  it.each([
    ['useExperience', () => useExperience()],
    ['useHoldProgress', () => useHoldProgress()],
    ['useExperienceSelector', () => useExperienceSelector(collectedCount)],
  ] as const)('%s throws a clear error', (name, hook) => {
    function Outside() {
      hook();
      return null;
    }
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Outside />)).toThrow(`${name}() must be used inside <ExperienceProvider>.`);
    silence.mockRestore();
  });
});
