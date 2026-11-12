# Design Brief — NeoBrutalism, done with restraint

This brief governs every pixel. The design agent (D-01) proposes **two directions** inside
these guardrails; Pim picks one; D-02 freezes it into tokens. After that, nobody invents
colours, shadows or type sizes — they use tokens.

## 1. What NeoBrutalism means here

The grammar is fixed; the mood is what the two directions vary.

**Fixed grammar**

- **Borders**: solid, black (or the ink token), 2px on small elements, 3px on cards and
  panels, 4px on the box. Never 1px, never grey.
- **Shadows**: hard offset, no blur. `--shadow-1: 4px 4px 0 var(--ink)`,
  `--shadow-2: 8px 8px 0 var(--ink)`. Interactive elements *press*: shadow shrinks to 0
  and the element translates by the same offset on `:active`.
- **Surfaces**: flat fills. No gradients except the single permitted *holo sweep* on rare
  cards (a 1-px-sharp diagonal band that moves, not a rainbow blur).
- **Corners**: 0–4px radius on UI; cards may use 10–12px because trading cards do.
- **Type**: one display grotesk with weight ≥ 700 for headings and card titles, one
  highly legible text face for body. Headings may be uppercase with tight tracking;
  body never is. Candidates for the display face: *Archivo Black*, *Space Grotesk 700*,
  *Bricolage Grotesque 800*. Body: *Inter*, *IBM Plex Sans*, *Atkinson Hyperlegible*.
  Self-host via `@fontsource`. No more than two families.
- **Colour**: an **ink** (near-black), a **paper** (cream or off-white or near-black for a
  dark direction), and **two accents** max. Pack chapters may each take one accent
  *tint* from a small fixed ramp; cards inherit their pack's accent.
- **Layout**: a visible grid is allowed (dot grid or hairline grid on the stage) at very
  low contrast. Content blocks are boxes with borders; boxes may overlap by their shadow
  offset to create depth.
- **Icons**: stroke icons, 2px, square caps. Lucide fits.

**What varies between the two directions (D-01)**

| | Direction 1 | Direction 2 |
|---|---|---|
| Paper | warm cream | cool off-white *or* near-black (agent chooses) |
| Accents | e.g. mustard + cobalt | e.g. tomato + mint, or one neon on dark |
| Display face | geometric grotesk | wide/expressive grotesk |
| Stage texture | dot grid | plain with a single oversized shadow |
| Rarity language | colour of border | border + corner stamp |

The agent should present each as a **style tile**: palette with tokens, type scale,
one button in all states, one card (common and rare) front and in detail view, the box
and a pack, and a mobile and desktop stage mock. Rendered at `/dev/direction/1` and
`/dev/direction/2` so they are real CSS, not images.

## 2. The taste test — "satisfying, not cheesy"

Before merging anything visual or animated, the reviewer answers these:

1. **Would it look at home in a well-designed product onboarding?** If it belongs in a
   casino app, no.
2. **Does the motion describe a physical cause?** Hold → tension → release. Card slides
   because it was pulled. If something moves without a reason, cut it.
3. **Is there exactly one focal animation at a time?** Two things celebrating at once
   is noise.
4. **Does it still make sense muted and with reduced motion?** State must be legible
   from layout and copy alone.
5. **Is the copy dry?** Humour comes from precision ("Rules lawyer — benign variant"),
   not exclamation marks.

### Banned

- Confetti, particle bursts, sparkles, coin/level-up/achievement sounds, emoji in UI.
- Bounce easings on anything larger than a button (`easeOutBack` is fine for icons only).
- Pulsing "click me" rings, wobble idle loops, tooltips that say "Try it!".
- Toasts. State changes are shown in place.
- Gradient text, glassmorphism, drop shadows with blur.
- Auto-advancing anything. The visitor sets the pace.

### Encouraged

- **Anticipation** before the big moment (pack tenses before the tear).
- **Settle** after motion (overshoot ≤ 6%, one oscillation, then rest).
- **Weight**: bigger things move slower. Box lid > pack > card > badge.
- **Micro-copy that acknowledges the visitor** without hype: "Not yet — keep holding.",
  "Last one in this pack.", "That's the box. Thanks for opening it."
- One **reserved moment** for rare cards: a 350 ms pause, the stage dims 8%, the card's
  holo sweep runs once. Nothing else.

## 3. Motion tokens (initial values; SC-03 tunes them)

All values live in `src/design/motion.ts` and are mirrored as CSS vars for CSS-only
transitions. Framer Motion springs are preferred for anything that settles.

```ts
export const dur = { xs: 0.12, sm: 0.2, md: 0.32, lg: 0.5, xl: 0.8 } as const;      // seconds
export const ease = {
  out:   [0.16, 1, 0.3, 1],     // expo-ish out, default for enters
  inOut: [0.65, 0, 0.35, 1],    // for moves between resting positions
  in:    [0.7, 0, 0.84, 0],     // exits only
} as const;
export const spring = {
  settle:  { type: 'spring', stiffness: 420, damping: 34, mass: 1 },   // UI, badges
  card:    { type: 'spring', stiffness: 260, damping: 28, mass: 1.1 }, // card to stage / binder
  pack:    { type: 'spring', stiffness: 180, damping: 24, mass: 1.4 }, // pack focus, tear pieces
  lid:     { type: 'spring', stiffness: 120, damping: 20, mass: 2 },   // box lid
} as const;
export const hold = { durationMs: 900, cancelReturnMs: 260, thresholdHaptic: [0.33, 0.66] } as const;
```

Under `prefers-reduced-motion: reduce`: all springs become `{ duration: 0.01 }`, hold
becomes a single press (progress jumps to 1 on pointer-up), layout transitions are
replaced by opacity fades of `dur.sm`.

## 4. Token structure (D-02 fills values)

```css
:root {
  /* colour */
  --ink: ; --paper: ; --paper-2: ; --accent-1: ; --accent-2: ;
  --tint-1: ; --tint-2: ; --tint-3: ; --tint-4: ; --tint-5: ;   /* pack accents */
  --rarity-common: ; --rarity-uncommon: ; --rarity-rare: ; --rarity-holo: ;
  /* geometry */
  --border-1: 2px; --border-2: 3px; --border-3: 4px;
  --radius-ui: 2px; --radius-card: 12px;
  --shadow-1: 4px 4px 0 var(--ink); --shadow-2: 8px 8px 0 var(--ink);
  /* type */
  --font-display: ; --font-text: ;
  --step--1: ; --step-0: ; --step-1: ; --step-2: ; --step-3: ; --step-4: ;  /* fluid scale */
  /* space (4px base) */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-6: 24px; --s-8: 32px; --s-12: 48px;
  /* z */
  --z-stage: 1; --z-binder: 10; --z-detail: 20; --z-chrome: 30;
}
```

Tokens are mirrored in `src/design/tokens.ts` for use in Framer Motion values and in
the OG renderer.

## 5. Card anatomy

A card is 63 × 88 mm proportion (5:7). On stage it is up to 360 px tall on desktop,
`min(72vh, 480px)` on mobile. Anatomy, top to bottom:

1. **Title bar**: title (display face), rarity mark on the right (a filled square for
   common, two for uncommon, outlined diamond for rare, diamond with holo band for holo).
2. **Art frame**: 5:4 window with `--border-2`. If `art` is `null`, render the
   **placeholder**: the pack's tint with a large outlined initial of the title and a
   corner label `ART` in `--step--1`. The placeholder must look intentional; Pim may
   ship with some placeholders.
3. **Type line**: pack name · card type (e.g. "Personality · Trait").
4. **Body**: flavour text (italic, 1–2 lines) and, in detail view, the longer text.
5. **Stats bar** (optional): up to 4 stats as label + 10-segment bar, segments are
   small squares with borders, filled with the pack tint.
6. **Footer**: card number `07 / 24` and a tag or two.

The **back** of a card is a single design: paper fill, ink border, a centered mark
(Pim's initials in a square or a small invented crest) — no portrait. Backs are visible
in the reveal stack.

## 6. Accessibility baseline

- Contrast ≥ 4.5:1 for text, ≥ 3:1 for borders and icons, in the chosen direction.
- Focus ring: 3px `--accent-1` outline with 2px offset; never removed.
- Touch targets ≥ 44 × 44 px. Hold interaction works with a thumb; nothing requires
  hover.
- All state changes announced through a single `aria-live="polite"` region
  (`src/chrome/LiveRegion.tsx`), with strings from `/content/strings.*.ts`.
