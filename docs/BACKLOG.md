# Backlog

Status values: `todo` · `in-progress` · `review` · `done` · `blocked`.
Size: S (≤ half a day for an agent), M (a day), L (two days). Lane letters refer to
PLAN §6. **Depends on** must be `done` before a story starts.

## Phase 0 — Foundation (serial)

| ID | Story | Size | Depends on | Owns (summary) | Status |
|---|---|---|---|---|---|
| [F-01](stories/F-01.md) | Scaffold: Vite + React + TS strict, lint, Vitest, Playwright, CI | M | — | repo root, `.github/`, `e2e/` config | done |
| [F-02](stories/F-02.md) | Design skeleton: tokens.css structure, motion.ts, reset, fonts, `useMotionPrefs` | S | F-01 | `src/design/*` | done |
| [F-03](stories/F-03.md) | Content schema, `define*`, loader, placeholder set, strings keys, `content:check` | M | F-01 | `src/content/*`, `content/*`, `scripts/content-check` | done |
| [F-04](stories/F-04.md) | Experience state machine + hold maths + `ExperienceProvider` | M | F-03 | `src/machine/*` | done |
| [F-05](stories/F-05.md) | Test harness: Playwright projects, reduced-motion fixture, hold override, screenshot helper | S | F-01, F-04 | `e2e/fixtures.ts`, `playwright.config.ts` | done |
| [F-06](stories/F-06.md) | App shell with slots, dev routes, LiveRegion stub, `layoutIds.ts` | S | F-02, F-04 | `src/app/*`, `src/scene/layoutIds.ts`, slot stubs | done |

**Milestone M0** after F-06.

## Phase 1 — Direction (serial)

| ID | Story | Size | Depends on | Owns | Status |
|---|---|---|---|---|---|
| [D-01](stories/D-01.md) | Two NeoBrutalist style tiles at `/dev/direction/1` and `/2` | M | F-06 | `src/dev/direction/*` | done |
| [D-02](stories/D-02.md) | Pim picks → finalise tokens, type scale, rarity + tint ramps, placeholder art design | S | D-01 + Pim's choice | `src/design/tokens.css`, `tokens.ts` | done |
| [D-03](stories/D-03.md) | Primitive kit + `/dev/kit`: Button, IconButton, Toggle, Badge, Frame, Chip, Kbd, VisuallyHidden | M | D-02 | `src/ui/*` | todo |

**Milestone M1** after D-03.

## Phase 2 — Experience (4 parallel lanes)

| ID | Lane | Story | Size | Depends on | Owns | Status |
|---|---|---|---|---|---|---|
| [SC-01](stories/SC-01.md) | A | Stage layout, regions, responsive frame, copy line under stage | S | D-03 | `src/scene/Stage*`, `src/app/App.tsx` | todo |
| [BX-01](stories/BX-01.md) | A | Sealed box: visual, wrap, set-name face, hover | M | SC-01 | `src/scene/Box*` | todo |
| [BX-02](stories/BX-02.md) | A | Hold-to-unwrap + open sequence (wrap split, lid, packs rise) | M | BX-01, PK-01 | `src/scene/Box*`, `src/scene/useHold.ts` | todo |
| [PK-01](stories/PK-01.md) | B | Pack shelf + Pack visual, opened/flattened state, roving focus | M | D-03 | `src/scene/Pack*`, `PackShelf*` | todo |
| [PK-02](stories/PK-02.md) | B | Focus pack (layoutId travel), back control, Esc | S | PK-01 | `src/scene/Pack*` | todo |
| [PK-03](stories/PK-03.md) | B | Hold-to-tear + tear sequence → stack handoff | M | PK-02, BX-02 (shares `useHold`) | `src/scene/Pack*` | todo |
| [CR-01](stories/CR-01.md) | C | Card component: front anatomy, back, rarity marks, placeholder art, stats bars | L | D-03 | `src/scene/Card*` (presentational) | todo |
| [CR-02](stories/CR-02.md) | C | Reveal stack + draw (slide-turn) + stage card + controls + rarity beats | M | CR-01 | `src/scene/RevealStack*`, `StageCard*` | todo |
| [CR-03](stories/CR-03.md) | C | Card detail overlay (layoutId expand, focus trap, markdown body, Esc) | M | CR-02 | `src/scene/CardDetail*` | todo |
| [CR-04](stories/CR-04.md) | C | Holo band: pointer/touch-following sweep, focus run; swipe-to-collect on mobile | S | CR-02 | `src/scene/Card*`, `StageCard*` | todo |
| [BN-01](stories/BN-01.md) | D | Binder: pre-rendered grouped slots, filled slot, collect landing, click → detail | M | D-03 | `src/binder/*` | todo |
| [BN-02](stories/BN-02.md) | D | Progress header, pack segments, all-collected state copy | S | BN-01 | `src/binder/Progress*` | todo |
| [BN-03](stories/BN-03.md) | D | Mobile binder strip + expandable sheet, auto-scroll on collect | M | BN-01 | `src/binder/BinderSheet*` | todo |
| [SC-02](stories/SC-02.md) | — | Integration: full loop, pack-complete, all-collected, reset flow, resolve lane Requests | M | BX-02, PK-03, CR-03, BN-02 | `src/app/App.tsx`, `src/chrome/ResetConfirm*`, glue | todo |
| [SC-03](stories/SC-03.md) | — | Tuning session with Pim: timings, springs, hold curve; before/after videos | S | SC-02 | `src/design/motion.ts`, INTERACTION-SPEC numbers | todo |

**Milestone M2** after SC-03.

## Phase 3 — Platform (parallel)

| ID | Story | Size | Depends on | Owns | Status |
|---|---|---|---|---|---|
| [PL-01](stories/PL-01.md) | i18n: `t()`, `useLocale`, detection, toggle (`L`), `lang` attr, per-locale card copy | M | F-06 | `src/platform/i18n/*`, `src/chrome/Header*` (lang part) | todo |
| [PL-02](stories/PL-02.md) | Persistence: versioned localStorage, hydrate, reset, contentVersion invalidation | S | F-04 | `src/platform/persistence/*` | todo |
| [PL-03](stories/PL-03.md) | Sound: Web Audio, samples, opt-in toggle (`M`), event mapping | M | SC-02 | `src/platform/audio/*`, `public/sfx/*` | todo |
| [PL-04](stories/PL-04.md) | Meta & OG: title/description per locale, `/dev/og` route, `og:render` script, favicon | S | D-02 | `src/platform/meta/*`, `scripts/og-render`, `public/` | todo |
| [PL-05](stories/PL-05.md) | Deploy: GitHub Pages workflow, base path, 404 → index, preview instructions | S | F-01 | `.github/workflows/deploy.yml`, `vite.config.ts` base | todo |
| [PL-06](stories/PL-06.md) | Mobile polish: thumb zones, safe areas, viewport units, performance on mid-range phone | M | SC-02, BN-03 | cross-cutting CSS (listed in story) | todo |
| [PL-07](stories/PL-07.md) | A11y pass: focus order, live region copy, shortcuts popover (`?`), contrast audit | M | SC-02, PL-01 | `src/chrome/ShortcutsPopover*`, `LiveRegion*` | todo |

**Milestone M3** after PL-01…PL-07.

## Phase 4 — Content tooling (parallel with 3)

| ID | Story | Size | Depends on | Owns | Status |
|---|---|---|---|---|---|
| [CT-01](stories/CT-01.md) | `content:new` scaffolder + `_template.ts` + `.ids.lock` versioning | S | F-03 | `scripts/content-new`, `content/cards/_template.ts` | todo |
| [CT-02](stories/CT-02.md) | Dev gallery `/dev/cards` with inline validation and filters | M | CR-01, CR-03 | `src/dev/cards/*` | todo |
| [CT-03](stories/CT-03.md) | Art pipeline: webp variants, lazy loading, `artAlt`, placeholder initial | S | CR-01 | `src/content/art.ts`, vite image plugin config | todo |
| [CT-04](stories/CT-04.md) | Contact card: `meta.contactCard`, auto-draw in all-collected, links in detail | S | SC-02 | `src/scene/ContactCard*` glue in StageCard | todo |
| [CT-05](stories/CT-05.md) | Pim's content pass (human story): fill workshop, write cards, place art, proofread NL/EN | L | CT-01, CT-02 | `content/*` | todo |

**Milestone M4** after CT-05.

## Phase 5 — QA & launch (serial)

| ID | Story | Size | Depends on | Owns | Status |
|---|---|---|---|---|---|
| [QA-01](stories/QA-01.md) | E2E suite: full happy path, persistence across reload, both locales, desktop + mobile + reduced motion | M | M3 | `e2e/journeys/*` | todo |
| [QA-02](stories/QA-02.md) | Visual review protocol run: reviewer agent walks the whole experience, taste test, writes findings | S | QA-01 | `docs/checkpoints/M5-review.md` | todo |
| [QA-03](stories/QA-03.md) | Performance: bundle budget, LazyMotion, art lazy-load, CLS/INP check on mobile | S | M3 | build config, lazy imports | todo |
| [QA-04](stories/QA-04.md) | Launch checklist: content final, OG verified in WhatsApp/LinkedIn, custom domain (optional), CHANGELOG | S | QA-02, QA-03, CT-05 | `docs/LAUNCH.md` | todo |

**Milestone M5** after QA-04.

## Dependency graph

```
F-01 ─┬─ F-02 ─────────────┬─ F-06 ─┬─ D-01 ─ D-02 ─ D-03 ─┬─ SC-01 ─ BX-01 ─ BX-02 ─┐
      ├─ F-03 ─ F-04 ─ F-05 ┘        │                      ├─ PK-01 ─ PK-02 ─ PK-03 ─┤
      │                              │                      ├─ CR-01 ─ CR-02 ─┬ CR-03 ┤
      │                              │                      │                 └ CR-04 │
      │                              │                      └─ BN-01 ─┬ BN-02 ────────┤
      │                              │                                └ BN-03         │
      │                              ├─ PL-01 ─────────────────────────────┐          │
      │                              └─ (F-04) PL-02 ─────────────────────┐│          │
      ├─ PL-05                                                            ││          │
      └─ (F-03) CT-01 ──┐                                                 ││          │
                        │   SC-02 ◄────────────────────────────────────────┼┼──────────┘
                        │     ├─ SC-03 (tuning, with Pim)                  ││
                        │     ├─ PL-03 sound                               ││
                        │     ├─ PL-06 mobile polish (also BN-03)          ││
                        │     ├─ PL-07 a11y (also PL-01) ◄─────────────────┘│
                        │     └─ CT-04 contact card                         │
   (CR-01, CR-03) CT-02 ┤                                                   │
   (CR-01)        CT-03 ┤                                                   │
   (D-02)         PL-04 ┘                                                   │
                        └──► CT-05 Pim writes content ──► QA-01 → QA-02 → QA-04
                                                           QA-03 ─────────┘
```

## Backlog hygiene

- Status edits only in this file's Status column; everything else changes via PR
  on the story file.
- New stories get the next number in their prefix and a file in `stories/`.
- Ideas that are out of scope for v1 go to `docs/LATER.md`.
