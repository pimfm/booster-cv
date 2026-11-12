/**
 * Typed mirror of tokens.css (DESIGN-BRIEF §4). Values are CSS `var()` references, so
 * they follow whatever tokens.css defines (Direction 1 "Print shop", final since D-02).
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
  ink2: 'var(--ink-2)',
  onAccent1: 'var(--on-accent-1)',
  onAccent2: 'var(--on-accent-2)',
  primary: 'var(--primary)',
  onPrimary: 'var(--on-primary)',
  wrap: 'var(--wrap)',
  holoBand: 'var(--holo-band)',
  // geometry
  border1: 'var(--border-1)',
  border2: 'var(--border-2)',
  border3: 'var(--border-3)',
  radiusUi: 'var(--radius-ui)',
  radiusCard: 'var(--radius-card)',
  shadow1: 'var(--shadow-1)',
  shadow2: 'var(--shadow-2)',
  shadow0: 'var(--shadow-0)',
  shadow3: 'var(--shadow-3)',
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

/**
 * Raw colour values of tokens.css, for places that cannot read CSS variables
 * (contrast tests, the OG renderer, theme-color meta). Keep in sync with tokens.css —
 * tokens.test.ts asserts they match.
 */
export const palette = {
  ink: '#17140f',
  ink2: '#514a3a',
  paper: '#f3ead2',
  paper2: '#e6dbbd',
  accent1: '#2346c7',
  accent2: '#e9b320',
  tint1: '#ee9f82',
  tint2: '#8fb4e3',
  tint3: '#9cc8a0',
  tint4: '#efc958',
  tint5: '#bfa8e0',
  rarityCommon: '#cdbf9f',
  rarityUncommon: '#9cc8a0',
  rarityRare: '#2346c7',
  rarityHolo: '#e9b320',
} as const;

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG 2.x contrast ratio between two #rrggbb colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
