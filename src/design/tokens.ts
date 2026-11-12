/**
 * Typed mirror of tokens.css (DESIGN-BRIEF §4). Values are CSS `var()` references, so
 * they follow whatever tokens.css defines (provisional until D-02).
 * Use in Framer Motion values, inline styles and the OG renderer.
 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'holo';
export type Tint = 1 | 2 | 3 | 4 | 5;

export const tokens = {
  // colour
  ink: 'var(--ink)',
  paper: 'var(--paper)',
  paper2: 'var(--paper-2)',
  accent1: 'var(--accent-1)',
  accent2: 'var(--accent-2)',
  tint1: 'var(--tint-1)',
  tint2: 'var(--tint-2)',
  tint3: 'var(--tint-3)',
  tint4: 'var(--tint-4)',
  tint5: 'var(--tint-5)',
  rarityCommon: 'var(--rarity-common)',
  rarityUncommon: 'var(--rarity-uncommon)',
  rarityRare: 'var(--rarity-rare)',
  rarityHolo: 'var(--rarity-holo)',
  // geometry
  border1: 'var(--border-1)',
  border2: 'var(--border-2)',
  border3: 'var(--border-3)',
  radiusUi: 'var(--radius-ui)',
  radiusCard: 'var(--radius-card)',
  shadow1: 'var(--shadow-1)',
  shadow2: 'var(--shadow-2)',
  // type
  fontDisplay: 'var(--font-display)',
  fontText: 'var(--font-text)',
  stepM1: 'var(--step--1)',
  step0: 'var(--step-0)',
  step1: 'var(--step-1)',
  step2: 'var(--step-2)',
  step3: 'var(--step-3)',
  step4: 'var(--step-4)',
  // space
  s1: 'var(--s-1)',
  s2: 'var(--s-2)',
  s3: 'var(--s-3)',
  s4: 'var(--s-4)',
  s6: 'var(--s-6)',
  s8: 'var(--s-8)',
  s12: 'var(--s-12)',
  // z
  zStage: 'var(--z-stage)',
  zBinder: 'var(--z-binder)',
  zDetail: 'var(--z-detail)',
  zChrome: 'var(--z-chrome)',
} as const;

export type TokenName = keyof typeof tokens;

/** Numeric z-index values, for places where a CSS var cannot be used. */
export const z = { stage: 1, binder: 10, detail: 20, chrome: 30 } as const;

const rarityTokens = {
  common: tokens.rarityCommon,
  uncommon: tokens.rarityUncommon,
  rare: tokens.rarityRare,
  holo: tokens.rarityHolo,
} as const satisfies Record<Rarity, string>;

const tintTokens = {
  1: tokens.tint1,
  2: tokens.tint2,
  3: tokens.tint3,
  4: tokens.tint4,
  5: tokens.tint5,
} as const satisfies Record<Tint, string>;

export function rarityToken<R extends Rarity>(r: R): (typeof rarityTokens)[R] {
  return rarityTokens[r];
}

export function tintToken<N extends Tint>(n: N): (typeof tintTokens)[N] {
  return tintTokens[n];
}
