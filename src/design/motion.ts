/**
 * Motion tokens — DESIGN-BRIEF §3 (initial values; SC-03 tunes them).
 * Durations are in SECONDS (Framer Motion convention). Mirrored as CSS vars in
 * tokens.css (--dur-*, --ease-*) for CSS-only transitions — keep both in sync.
 */
export const dur = { xs: 0.12, sm: 0.2, md: 0.32, lg: 0.5, xl: 0.8 } as const;

export const ease = {
  out: [0.16, 1, 0.3, 1], // expo-ish out, default for enters
  inOut: [0.65, 0, 0.35, 1], // for moves between resting positions
  in: [0.7, 0, 0.84, 0], // exits only
} as const;

export const spring = {
  settle: { type: 'spring', stiffness: 420, damping: 34, mass: 1 }, // UI, badges
  card: { type: 'spring', stiffness: 260, damping: 28, mass: 1.1 }, // card to stage / binder
  pack: { type: 'spring', stiffness: 180, damping: 24, mass: 1.4 }, // pack focus, tear pieces
  lid: { type: 'spring', stiffness: 120, damping: 20, mass: 2 }, // box lid
} as const;

export const hold = { durationMs: 900, cancelReturnMs: 260, thresholdHaptic: [0.33, 0.66] } as const;

/** Transition used for everything that would otherwise spring, under reduced motion. */
export const reducedTransition = { duration: 0.01 } as const;

export type DurName = keyof typeof dur;
export type EaseName = keyof typeof ease;
export type SpringName = keyof typeof spring;
export interface SpringConfig {
  readonly type: 'spring';
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}
export type ReducedTransition = typeof reducedTransition;

const isProduction = (): boolean => import.meta.env.MODE === 'production';

function overrideGroup(group: 'dur' | 'spring'): Record<string, unknown> | undefined {
  if (isProduction() || typeof window === 'undefined') return undefined;
  const value = window.__MOTION_OVERRIDES__?.[group];
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
}

/**
 * Spring config by name. In non-production builds `window.__MOTION_OVERRIDES__.spring`
 * may override per name (shallow merge onto the default), e.g.
 * `window.__MOTION_OVERRIDES__ = { spring: { card: { stiffness: 300 } } }`.
 */
export function getSpring(name: SpringName): SpringConfig {
  const override = overrideGroup('spring')?.[name];
  return typeof override === 'object' && override !== null
    ? { ...spring[name], ...(override as Partial<SpringConfig>), type: 'spring' }
    : spring[name];
}

/**
 * Duration (seconds) by name. In non-production builds
 * `window.__MOTION_OVERRIDES__.dur` may override per name.
 */
export function getDur(name: DurName): number {
  const override = overrideGroup('dur')?.[name];
  return typeof override === 'number' && Number.isFinite(override) ? override : dur[name];
}

/**
 * Hold-to-open duration in ms. Dev/test builds honour `window.__BOOSTER_HOLD_MS__`
 * (Playwright sets 50); production always returns `hold.durationMs`.
 */
export function holdDurationMs(): number {
  if (!isProduction() && typeof window !== 'undefined') {
    const override = window.__BOOSTER_HOLD_MS__;
    if (typeof override === 'number' && Number.isFinite(override)) return override;
  }
  return hold.durationMs;
}
