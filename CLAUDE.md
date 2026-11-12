# booster-cv — instructions for agents

A playful CV for a board-game store: a sealed booster box the visitor opens; the cards
are Pim. NeoBrutalist, deliberate motion, bilingual (EN/NL), static site.

**Read first:** `docs/PLAN.md` → your story in `docs/stories/<ID>.md` → the linked
sections of `docs/DESIGN-BRIEF.md` and `docs/INTERACTION-SPEC.md`. Workflow rules are
in `docs/AGENT-WORKFLOW.md` and are not optional.

## Stack

Vite · React 18 · TypeScript strict · Framer Motion (`LazyMotion` + `m.*`) · CSS
Modules + CSS custom-property tokens · zod · Vitest + Testing Library · Playwright
(projects: `desktop-chromium`, `mobile-webkit`, each also with a reduced-motion
fixture) · ESLint + Prettier · GitHub Actions → GitHub Pages.

## Commands

```
npm run dev            # http://localhost:5173  (dev routes: /dev/cards, /dev/kit, /dev/direction/1|2)
npm run check          # typecheck + lint + vitest + content:check  — must pass before any PR
npm run e2e            # playwright, all projects
npm run e2e -- --project=mobile-webkit
npm run content:check  # validate /content
npm run content:new -- --id <id> --pack <pack> --rarity <rarity>
npm run og:render      # regenerate public/og.png from /dev/og
npm run build && npm run preview
```

## Hard rules

1. **No copy in components.** Every visible string comes from `/content/strings.*.ts`
   or a card. Add keys additively; never rename.
2. **No raw numbers for motion or colour.** Durations, easings, springs: `src/design/motion.ts`.
   Colours, borders, shadows, type, space: `src/design/tokens.css` (+ `tokens.ts`).
3. **The machine owns state.** UI dispatches actions and reads `useExperience()`.
   Components never keep experience state in `useState`; local UI state (hover, pointer
   position for the holo band) is fine.
4. **Touch only files your story owns** (see story file → *Owns*). Anything else is a
   `## Requests` item in your PR.
5. **Reduced motion is a first-class path**, not a `return null`. Use `useReducedMotion()`
   via `src/design/useMotionPrefs.ts`, which also exposes the test override.
6. **Keyboard parity** for every pointer interaction (INTERACTION-SPEC §10).
7. **Placeholders are designed**, not grey boxes. Placeholder art and placeholder
   cards (`src/content/placeholders.ts`) must pass the taste test.
8. Banned (DESIGN-BRIEF §2): confetti, particles, bounce easings on large elements,
   toasts, pulsing hints, auto-advance, gradients (except the holo band), emoji in UI.

## Layout of the repo

```
content/   Pim's content (cards, packs, art, strings, meta)   — agents: only placeholders
src/app    shell, providers, routes
src/machine  reducer + types + hold maths   — CONTRACT, owned by F-04
src/content  schema, loader, define(), placeholders
src/design   tokens, motion, reset, useMotionPrefs
src/ui       primitives (Button, IconButton, Toggle, Badge, Frame, Kbd, VisuallyHidden, Chip)
src/scene    Stage, Box, PackShelf, Pack, RevealStack, StageCard, CardDetail, layoutIds
src/binder   Binder, BinderSlot, BinderSheet, Progress
src/chrome   Header, LiveRegion, ResetConfirm, ShortcutsPopover
src/platform i18n, persistence, audio, meta
scripts/     content-new, content-check, og-render
e2e/         playwright specs, fixtures, __screens__
docs/        plan, specs, backlog, stories, checkpoints, CHANGELOG
```

## Definition of done (short form)

Acceptance criteria ticked · `npm run check` green · e2e desktop + mobile + reduced
motion green · screenshots in `e2e/__screens__/<ID>-*` · reviewer agent approval ·
BACKLOG status updated · CHANGELOG lines added · docs touched if behaviour changed.

## Testing hold interactions

Dev/test builds honour `window.__BOOSTER_HOLD_MS__` (default 900). Playwright fixtures
set it to 50. Never ship logic that depends on it in production.

## Git

Branch `story/<ID>-<slug>`. Conventional commits (`feat(PK-02): hold-to-tear`). PR
body uses the template in AGENT-WORKFLOW §6. Rebase on `main` before merge.
