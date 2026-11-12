/**
 * Animation activity: is anything moving right now?
 *
 * Motion components spread `useAnimationTracking()` onto their `m.*` element. `<main>` then
 * carries `data-animating="true|false"` (also true while a hold is running or relaxing),
 * which Playwright's `settle()` and `shot()` wait on.
 *
 * The count lives in a plain store and the attribute is written imperatively, so an
 * animation starting or ending never re-renders React.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';

export interface AnimationActivity {
  /** one more thing is animating */
  begin(): void;
  /** one thing stopped animating */
  end(): void;
  count(): number;
  /** called on every change of `count() > 0`; returns the unsubscribe function */
  subscribe(listener: () => void): () => void;
}

export function createAnimationActivity(): AnimationActivity {
  let active = 0;
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  return {
    begin() {
      active += 1;
      if (active === 1) notify();
    },
    end() {
      if (active === 0) return;
      active -= 1;
      if (active === 0) notify();
    },
    count: () => active,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const AnimationActivityContext = createContext<AnimationActivity | null>(null);

export function AnimationActivityProvider({ children }: { children: ReactNode }) {
  const [activity] = useState(createAnimationActivity);
  return (
    <AnimationActivityContext.Provider value={activity}>
      {children}
    </AnimationActivityContext.Provider>
  );
}

export function useAnimationActivity(): AnimationActivity {
  const activity = useContext(AnimationActivityContext);
  if (activity === null)
    throw new Error('useAnimationActivity() must be used inside <AnimationActivityProvider>.');
  return activity;
}

export interface AnimationTrackingProps {
  onAnimationStart: () => void;
  onAnimationComplete: () => void;
}

/**
 * Stable props for a motion component: `<m.div {...useAnimationTracking()} animate={…} />`.
 * One hook call per motion element. An element counts once however many of its animations
 * overlap, and is released when it unmounts mid-animation.
 */
export function useAnimationTracking(): AnimationTrackingProps {
  const activity = useAnimationActivity();
  const running = useRef(false);

  useEffect(
    () => () => {
      if (running.current) {
        running.current = false;
        activity.end();
      }
    },
    [activity],
  );

  return useMemo(
    () => ({
      onAnimationStart: () => {
        if (running.current) return;
        running.current = true;
        activity.begin();
      },
      onAnimationComplete: () => {
        if (!running.current) return;
        running.current = false;
        activity.end();
      },
    }),
    [activity],
  );
}

/**
 * Keeps `data-animating` on `ref` in sync: true while any tracked animation runs or `busy`
 * is set (the shell passes "a hold is running or relaxing").
 */
export function useAnimatingAttribute(ref: RefObject<HTMLElement | null>, busy: boolean): void {
  const activity = useAnimationActivity();
  useEffect(() => {
    const apply = () => {
      ref.current?.setAttribute('data-animating', String(busy || activity.count() > 0));
    };
    apply();
    return activity.subscribe(apply);
  }, [activity, busy, ref]);
}
