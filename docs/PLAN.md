# Booster CV — Project Plan

> A sealed booster box. You open it, pull a pack, hold to tear it, and the cards that come
> out are Pim. The page is a playful CV for a local board-game store — and it has to feel
> like a *good* product, not a gimmick.

This document is the single source of truth for **what** we are building and **why**.
The companion documents say *how*:

| Document | Purpose |
|---|---|
| [DESIGN-BRIEF.md](./DESIGN-BRIEF.md) | NeoBrutalist direction, taste guardrails ("not cheesy"), token strategy |
| [INTERACTION-SPEC.md](./INTERACTION-SPEC.md) | The choreography: every state, every animation, every timing |
| [CONTENT-AUTHORING.md](./CONTENT-AUTHORING.md) | How Pim writes cards; schema, art slots, validation |
| [CONTENT-WORKSHOP.md](./CONTENT-WORKSHOP.md) | Worksheet to draft the actual cards |
| [AGENT-WORKFLOW.md](./AGENT-WORKFLOW.md) | How agents pick up stories, own files, review and merge |
| [BACKLOG.md](./BACKLOG.md) | Every story, its lane, dependencies and status |
| [stories/](./stories/) | One file per story with acceptance criteria |

---

## 1. Goals

1. **Make a store owner smile, then learn something true about Pim.** Every interaction
   must earn its place; the page should be as fun on a second visit as the first.
2. **Feel professional.** Confident NeoBrutalism, deliberate motion, zero stock
   "gamification" clichés (no confetti cannons, no coin sounds, no achievement toasts).
3. **Be fully content-driven.** Pim writes every word and places every image in a typed
   content folder. Agents never hard-code copy or personality claims.
4. **Work on a phone held in one hand** as well as on a laptop, with keyboard and
   reduced-motion paths that are first-class, not fallbacks.
5. **Ship as a static site** with CI, tests and a link preview that looks like the box.

## 2. Non-goals (v1)

- No backend, accounts, analytics or form submission.
- No 3D card flip / WebGL. Cards slide, scale and settle; they do not rotate in 3D.
- No printable/PDF CV route (may come later as a "plain version" link).
- No multiple boxes, trading, or randomness. Card order per pack is **authored**.

## 3. The experience in one paragraph

A sealed box sits on a cream stage. Holding it tears the shrink-wrap and the lid lifts;
inside are three to five packs, each a chapter of Pim (for example *Personality*,
*Craft*, *At the table*). Pick a pack: it comes to the front. Press and hold: the pack
tenses, the seam brightens, resistance builds — release too early and it relaxes back
with a small "not yet" settle; hold through and it tears. Cards slide out as a stack.
Tap the top card to pull it forward; it lands on the stage with its rarity treatment,
you read it, tap again (or press →) and it files itself into the binder along the edge
of the screen. Rare cards get one extra beat. When a pack is empty, the box is back with
one pack fewer. When the binder is full, the last card is the one that matters: the
contact card. Progress survives a refresh; a quiet "Reset box" puts the wrap back on.

## 4. Architecture decisions (ADRs in brief)

| # | Decision | Rationale |
|---|---|---|
| A1 | **Vite + React 18 + TypeScript (strict)** | Component model maps 1:1 to box/pack/card; fast dev loop; agents know it well. |
| A2 | **Framer Motion** for all animation | Declarative variants, `layoutId` shared-element transitions (card → detail), springs, `useReducedMotion`. One animation vocabulary for every agent. |
| A3 | **Hand-rolled typed reducer** for the experience state machine, no XState | ~12 states, one machine; a pure reducer is fully unit-testable with Vitest and has zero runtime cost. Transitions are the *contract* between lanes. |
| A4 | **Content as TypeScript modules** in `/content`, validated by **zod** | Autocomplete and type errors while writing; `npm run content:check` catches missing translations and art. No CMS. |
| A5 | **CSS custom properties for tokens**, CSS Modules for component styles | Tokens are shared with Framer Motion via a `tokens.ts` mirror. No Tailwind: brutalism lives on exact borders, shadows and type, better owned explicitly. |
| A6 | **Tiny in-house i18n** (`t()` + `useLocale()`), locales `en`/`nl` | UI chrome strings in dictionaries; card copy is per-locale inside each card object. |
| A7 | **Persistence in `localStorage`**, versioned schema | Binder survives refresh; a content version bump invalidates stale progress. |
| A8 | **Audio via Web Audio API**, opt-in, muted by default, 4–6 short samples | No autoplay; toggled in the header; never required to understand state. |
| A9 | **Static hosting on GitHub Pages via Actions** (Vercel-compatible) | Zero cost, PR previews not needed; `base` configurable. |
| A10 | **Vitest** (logic) + **Playwright** (e2e, desktop + mobile, reduced motion) + **reviewer agent with screenshots** | Matches the chosen definition of done. |

## 5. System overview

```
/content                     ← Pim's domain. Packs, cards, art, UI strings.
  packs.ts
  cards/<id>.ts
  art/<id>.(png|webp|svg)
  strings.en.ts, strings.nl.ts
/src
  app/            App shell, providers (Locale, Audio, Persistence), routes (/ and /dev/cards)
  machine/        Experience reducer, types, selectors, hold-progress maths   ← CONTRACT
  content/        schema.ts (zod), loader.ts, placeholders
  design/         tokens.css, tokens.ts, motion.ts (springs/durations), reset.css
  ui/             Primitive kit: Button, IconButton, Toggle, Badge, Frame, Kbd, VisuallyHidden
  scene/          Stage, Box, PackShelf, Pack, RevealStack, StageCard, CardDetail
  binder/         Binder, BinderSlot, Progress
  chrome/         Header (lang, sound, reset), Footer, ContactCTA
  platform/       i18n, persistence, audio, meta
/e2e                          Playwright
/scripts                      content:new, content:check, og:render
/docs                         this folder
```

### The one contract every lane depends on

`src/machine/` exports:

```ts
// src/machine/types.ts (verbatim)
export const PHASES = [
  'sealed',
  'unwrapping',
  'box-open',
  'pack-focused',
  'pack-tearing',
  'revealing',
  'card-on-stage',
  'card-detail',
  'pack-complete',
  'all-collected',
  'resetting',
] as const;

export type Phase = (typeof PHASES)[number];

/** 'up' while held, 'down' while relaxing after an early release, 'idle' otherwise. */
export type HoldDirection = 'up' | 'down' | 'idle';
export type HoldTarget = 'box' | 'pack';

export interface ExperienceState {
  phase: Phase;
  /** set from FOCUS_PACK until DISMISS_PACK / UNFOCUS_PACK */
  focusedPackId: string | null;
  /** LINEAR time fraction 0..1 — visuals apply `holdCurve` (see `holdVisual`) */
  holdProgress: number;
  holdDirection: HoldDirection;
  /** what is being held or is relaxing; null when idle */
  holdTarget: HoldTarget | null;
  /** null until the first early release, then a counter (1, 2, …) — not a timestamp */
  lastHoldCancelledAt: number | null;
  /** cards still to draw, top first */
  queue: string[];
  stageCardId: string | null;
  detailCardId: string | null;
  /** where CLOSE_DETAIL goes back to; only set in 'card-detail' */
  returnPhase: Phase | null;
  /** the binder, in collection order */
  collected: string[];
  /** in the order the packs were finished */
  openedPacks: string[];
  /** a rare or holo card has been drawn (or hydrated) at least once */
  seenRare: boolean;
}

export type Action =
  | { type: 'HOLD_START' }
  | { type: 'HOLD_TICK'; dtMs: number }
  | { type: 'HOLD_END' }
  | { type: 'TEAR_COMPLETE' }
  | { type: 'FOCUS_PACK'; packId: string }
  | { type: 'UNFOCUS_PACK' }
  | { type: 'DRAW_CARD' }
  | { type: 'OPEN_DETAIL'; cardId?: string }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'COLLECT_CARD' }
  | { type: 'DISMISS_PACK' }
  | { type: 'RESET' }
  | { type: 'RESET_DONE' }
  | { type: 'HYDRATE'; collected: readonly string[]; openedPacks: readonly string[] };
```

Decisions made in F-04 (details in INTERACTION-SPEC, "Machine decisions"):
- No `pack-torn` phase: a tear goes straight to `revealing`; the stack-rise plays during
  `revealing` and the stack ignores input for its first 400 ms.
- `holdProgress` is linear; visuals apply `holdCurve` via `holdVisual`. Hold marks
  0.33 / 0.66 apply to linear progress. Hold fields reset when a hold completes.
- The machine completes holds itself; the UI dispatches `TEAR_COMPLETE` only under
  reduced motion (one press instead of a hold).
- In `all-collected` the contact card is queued and the UI dispatches `DRAW_CARD` for it.
- `RESET` → `resetting` → `RESET_DONE` → `sealed`.
- `VALID_ACTIONS` (reducer.ts) is the whole validity table; anything else returns the
  same state object.
- Card counts come from content (`totalCount(bundle)` = pack cards + contact card).

Story **F-04** owns this file. Everything else consumes it. Changing it requires a PR
that touches `docs/INTERACTION-SPEC.md` in the same change.

## 6. Phases and lanes

Execution model: **serial foundation, then four parallel lanes**, then a serial
integration/QA phase. Lanes are designed so that two agents never need to edit the same
file; see [AGENT-WORKFLOW.md](./AGENT-WORKFLOW.md).

| Phase | Mode | Stories | Outcome |
|---|---|---|---|
| **0 Foundation** | serial | F-01 … F-06 | Repo runs, tokens skeleton, content schema, state machine, CI, test harness |
| **1 Direction** | serial (design) | D-01 … D-03 | Two style tiles → Pim picks → final tokens → primitive kit |
| **2 Experience** | **parallel, 4 lanes** | BX-*, PK-*, CR-*, BN-*, SC-* | The full open-box → binder loop with placeholder content |
| **3 Platform** | parallel, 2–3 lanes | PL-01 … PL-07 | i18n, persistence, sound, meta/OG, deploy, mobile polish, a11y |
| **4 Content tooling** | parallel with 3 | CT-01 … CT-05 | Scaffolder, dev gallery, contact card, art slots; Pim writes content |
| **5 QA & launch** | serial | QA-01 … QA-04 | e2e suite green, visual review signed off, launch checklist |

### Lane map for Phase 2

| Lane | Owns | Stories |
|---|---|---|
| **A — Box & Stage** | `src/scene/Stage*`, `src/scene/Box*` | SC-01, BX-01, BX-02 |
| **B — Packs** | `src/scene/Pack*`, `src/scene/PackShelf*` | PK-01, PK-02, PK-03 |
| **C — Cards** | `src/scene/StageCard*`, `src/scene/RevealStack*`, `src/scene/CardDetail*` | CR-01, CR-02, CR-03, CR-04 |
| **D — Binder & Chrome** | `src/binder/*`, `src/chrome/*` | BN-01, BN-02, BN-03 |

Each lane plugs into the machine via `useExperience()` and renders based on `phase`.
Lane boundaries are component boundaries; the composition in `src/app/App.tsx` is done
in **SC-02** after lanes land.

## 7. Milestones

| Milestone | Definition | Suggested checkpoint with Pim |
|---|---|---|
| **M0 Skeleton** | `npm run dev` shows a cream stage with a grey box; machine tests pass; CI green | Confirm stack & repo layout |
| **M1 Direction locked** | Two style tiles reviewed; tokens finalised; kit storybook-like page at `/dev/kit` | **Pim picks a direction** |
| **M2 Loop works** | Box → pack → hold → cards → binder with placeholder cards, desktop only | Play it; adjust feel (timings) |
| **M3 Platform** | NL/EN, persistence, sound, OG, deployed preview URL, mobile good | Play on a phone |
| **M4 Content in** | Pim's real cards & art, contact card, gallery validated | Proofread NL/EN |
| **M5 Launch** | e2e green, reviewer sign-off, launch checklist done | Send the link |

## 8. Risks and how the plan handles them

| Risk | Mitigation |
|---|---|
| Animation feel is subjective and the plan is written by agents | INTERACTION-SPEC pins every timing; `src/design/motion.ts` is the only place numbers live; M2 includes a dedicated **tuning session** story (SC-03) where Pim adjusts values. |
| "Satisfying" tips into "cheesy" | DESIGN-BRIEF has an explicit *banned list* and a *taste test*; the reviewer agent checks against it. |
| Parallel agents collide | File ownership per lane; machine contract frozen in Phase 0; composition story after lanes. |
| Content arrives late | Everything runs on placeholder cards from F-03; `content:check` tells Pim exactly what is missing. |
| Mobile is an afterthought | Playwright runs the mobile viewport from QA-01 onwards; PL-06 is a dedicated mobile polish story; hold-to-open is designed for thumbs. |
| Bundle/perf regressions from motion | Framer Motion `LazyMotion` with `domAnimation`; art lazy-loaded; QA-03 checks bundle size. |

## 9. Definition of Done (project-wide)

A story is done when:

1. Acceptance criteria in its story file are met and ticked in the PR description.
2. `npm run check` passes: typecheck, lint, Vitest, `content:check`.
3. Playwright suites relevant to the story pass on desktop **and** mobile projects, and
   under `prefers-reduced-motion: reduce` where the story has motion.
4. The reviewer agent has reviewed screenshots (light theme, desktop + mobile) against
   DESIGN-BRIEF and INTERACTION-SPEC and left an approval note in the PR.
5. No new strings outside `/content/strings.*.ts`; no hard-coded colours, durations or
   easings outside `src/design/`.
6. Docs touched when behaviour changed (INTERACTION-SPEC, CONTENT-AUTHORING).
