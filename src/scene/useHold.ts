/**
 * Hold-to-open event props, shared by the box and the focused pack (INTERACTION-SPEC §1, §3, §10).
 *
 *   const hold = useHold();
 *   <button {...hold} style={{ touchAction: 'none' }} />     // touch-action is the consumer's job
 *
 * Pointer or Space/Enter down → HOLD_START; release, cancel, leave or blur → HOLD_END. The
 * machine completes the hold itself when progress reaches 1. Under reduced motion there is
 * no hold: one click (or Enter/Space, which a button turns into a click) → TEAR_COMPLETE.
 */
import { useMemo } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { useMotionPrefs } from '@/design/useMotionPrefs';
import { useExperience } from '@/machine';

export interface HoldProps<E extends HTMLElement = HTMLElement> {
  onPointerDown: (event: PointerEvent<E>) => void;
  onPointerUp: (event: PointerEvent<E>) => void;
  onPointerCancel: (event: PointerEvent<E>) => void;
  onPointerLeave: (event: PointerEvent<E>) => void;
  onKeyDown: (event: KeyboardEvent<E>) => void;
  onKeyUp: (event: KeyboardEvent<E>) => void;
  onBlur: (event: FocusEvent<E>) => void;
  onContextMenu: (event: MouseEvent<E>) => void;
  onClick: (event: MouseEvent<E>) => void;
}

const isHoldKey = (key: string): boolean => key === ' ' || key === 'Enter';

export function useHold<E extends HTMLElement = HTMLElement>(): HoldProps<E> {
  const { dispatch } = useExperience();
  const { reduced } = useMotionPrefs();

  return useMemo<HoldProps<E>>(() => {
    const start = () => dispatch({ type: 'HOLD_START' });
    const end = () => dispatch({ type: 'HOLD_END' });
    const noop = () => {};
    // a long-press must not open the context menu (touch) in either mode
    const onContextMenu = (event: MouseEvent<E>) => event.preventDefault();

    if (reduced) {
      return {
        onPointerDown: noop,
        onPointerUp: noop,
        onPointerCancel: noop,
        onPointerLeave: noop,
        onKeyDown: noop,
        onKeyUp: noop,
        onBlur: noop,
        onContextMenu,
        onClick: () => dispatch({ type: 'TEAR_COMPLETE' }),
      };
    }

    return {
      onPointerDown: (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        try {
          // keep receiving the pointer if it slides off the target during the squeeze
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // synthetic pointers (tests) have no capturable id
        }
        start();
      },
      onPointerUp: end,
      onPointerCancel: end,
      onPointerLeave: end,
      onKeyDown: (event) => {
        if (!isHoldKey(event.key)) return;
        event.preventDefault(); // no page scroll on Space, no click on Enter
        if (!event.repeat) start();
      },
      onKeyUp: (event) => {
        if (!isHoldKey(event.key)) return;
        event.preventDefault(); // no click on Space release
        end();
      },
      onBlur: end,
      onContextMenu,
      onClick: noop,
    };
  }, [dispatch, reduced]);
}
