import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import {
  AnimationActivityProvider,
  createAnimationActivity,
  useAnimatingAttribute,
  useAnimationTracking,
} from './animationActivity';
import type { AnimationTrackingProps } from './animationActivity';

describe('createAnimationActivity', () => {
  it('counts and notifies only on idle ↔ busy', () => {
    const activity = createAnimationActivity();
    const listener = vi.fn();
    const off = activity.subscribe(listener);
    activity.begin();
    activity.begin();
    expect(activity.count()).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
    activity.end();
    activity.end();
    activity.end(); // never below zero
    expect(activity.count()).toBe(0);
    expect(listener).toHaveBeenCalledTimes(2);
    off();
    activity.begin();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('useAnimationTracking + useAnimatingAttribute', () => {
  let props: AnimationTrackingProps[] = [];
  let renders = 0;

  function Tracked() {
    props.push(useAnimationTracking());
    return null;
  }

  function Host({ busy, show }: { busy: boolean; show: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    useAnimatingAttribute(ref, busy);
    renders += 1;
    return (
      <div ref={ref} data-testid="host">
        {show ? <Tracked /> : null}
      </div>
    );
  }

  const setup = (busy = false, show = true) =>
    render(
      <AnimationActivityProvider>
        <Host busy={busy} show={show} />
      </AnimationActivityProvider>,
    );

  beforeEach(() => {
    props = [];
    renders = 0;
  });

  it('flips the attribute without re-rendering', () => {
    setup();
    const host = screen.getByTestId('host');
    expect(host).toHaveAttribute('data-animating', 'false');
    const before = renders;
    const tracking = props.at(-1)!;
    act(() => tracking.onAnimationStart());
    act(() => tracking.onAnimationStart()); // the same element counts once
    expect(host).toHaveAttribute('data-animating', 'true');
    act(() => tracking.onAnimationComplete());
    expect(host).toHaveAttribute('data-animating', 'false');
    expect(renders).toBe(before);
  });

  it('busy forces true', () => {
    setup(true);
    expect(screen.getByTestId('host')).toHaveAttribute('data-animating', 'true');
  });

  it('props are stable and an unmount mid-animation releases the count', () => {
    const view = setup();
    const tracking = props.at(-1)!;
    view.rerender(
      <AnimationActivityProvider>
        <Host busy={false} show />
      </AnimationActivityProvider>,
    );
    expect(props.at(-1)).toBe(tracking);
    act(() => tracking.onAnimationStart());
    expect(screen.getByTestId('host')).toHaveAttribute('data-animating', 'true');
    view.rerender(
      <AnimationActivityProvider>
        <Host busy={false} show={false} />
      </AnimationActivityProvider>,
    );
    expect(screen.getByTestId('host')).toHaveAttribute('data-animating', 'false');
  });
});
