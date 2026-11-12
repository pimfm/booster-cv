/**
 * Timed beats of the scene that are not Framer transitions (INTERACTION-SPEC §1, §4, §6).
 * Milliseconds. SC-03 may move these into src/design/motion.ts when it tunes them.
 */
export const sceneTiming = {
  /** how long "Not yet — keep holding." replaces the hint after an early release (§1) */
  notYetMs: 1600,
  /** "Pack done." stays this long before DISMISS_PACK, unless a click or key comes first (§6) */
  packDoneMs: 900,
  /** the reveal stack ignores input while it rises out of the pack (§3–§4) */
  stackRiseMs: 400,
} as const;
