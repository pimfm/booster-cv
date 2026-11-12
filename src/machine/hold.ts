/**
 * Hold-progress maths — INTERACTION-SPEC §11. Pure and clamped to 0..1.
 * The machine stores LINEAR progress (a time fraction); `holdCurve` shapes it for visuals.
 */
import { hold } from '@/design/motion';

/** Where the curve turns from slow to quick, and its value there (INTERACTION-SPEC §1). */
const KNEE = 0.7;
const KNEE_VALUE = 0.56;
const SLOPE_BEFORE = KNEE_VALUE / KNEE;
const SLOPE_AFTER = (1 - KNEE_VALUE) / (1 - KNEE);

function clamp01(value: number): number {
  if (!(value > 0)) return 0; // also catches NaN
  return value < 1 ? value : 1;
}

/** Slow, then quick: 0 → 0, 0.7 → 0.56, 1 → 1. Continuous and monotonic. */
export function holdCurve(t: number): number {
  const x = clamp01(t);
  return clamp01(x < KNEE ? x * SLOPE_BEFORE : KNEE_VALUE + (x - KNEE) * SLOPE_AFTER);
}

/** Progress after holding for another `dtMs`. A non-positive duration completes at once. */
export function advanceHold(progress: number, dtMs: number, durationMs: number = hold.durationMs): number {
  const from = clamp01(progress);
  if (!(dtMs > 0)) return from;
  if (!(durationMs > 0)) return 1;
  return clamp01(from + dtMs / durationMs);
}

/** Progress after relaxing for `dtMs`; a full 1 → 0 takes `returnMs`. */
export function relaxHold(progress: number, dtMs: number, returnMs: number = hold.cancelReturnMs): number {
  const from = clamp01(progress);
  if (!(dtMs > 0)) return from;
  if (!(returnMs > 0)) return 0;
  return clamp01(from - dtMs / returnMs);
}

/**
 * The mark crossed going up from `prev` to `next`, i.e. the mark in (prev, next].
 * If one step crosses several, the highest is returned. Nothing crossed → null.
 */
export function crossedMark(prev: number, next: number, marks: readonly number[]): number | null {
  let crossed: number | null = null;
  for (const mark of marks) {
    if (prev < mark && mark <= next && (crossed === null || mark > crossed)) crossed = mark;
  }
  return crossed;
}
