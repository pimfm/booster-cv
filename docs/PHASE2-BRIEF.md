# Phase 2 — shared brief for lane agents

Four lanes run in parallel in the same working tree (no worktrees, no git — the orchestrator commits).

| Lane | Stories | Owns (create/modify only these, plus your tests and `e2e/<ID>-*.spec.ts`) |
|---|---|---|
| A Box & Stage | SC-01, BX-01, BX-02 | `src/scene/Stage*`, `src/scene/StageCopy*`, `src/scene/stageCopy.ts`, `src/scene/Box*`, `src/scene/useHold.ts`, `src/scene/holdFx.ts`, `src/app/layout.module.css`, `src/app/Experience.tsx` (layout only, keep slot list) |
| B Packs | PK-01, PK-02, PK-03 | `src/scene/Pack*` (PackShelf, Pack, PackCrimp, FocusedPack, PackTear, packVariants, BackToBox) — NOT PackComplete |
| C Cards | CR-01, CR-02, CR-03, CR-04 | `src/scene/Card*` (Card, CardFront, CardBack, CardArt, CardStats, CardTitleBar, CardDetail), `src/scene/RevealStack*`, `src/scene/StageCard*`, `src/scene/HoloBand*`, `src/scene/use{FocusTrap,HoloPointer,SwipeCollect}.ts`, `src/scene/markdown.tsx`, `src/scene/rarityBeats.ts`, `src/scene/cardSizes.ts`, `src/scene/Scrim*`, `src/dev/kit/Cards*` → but put the card gallery in `src/dev/cards.route.tsx` + `src/dev/cards/*` |
| D Binder & Chrome | BN-01, BN-02, BN-03 + Header styling | `src/binder/**`, `src/chrome/Header*` |

Not owned by anyone in Phase 2 (integration SC-02 later): `src/scene/PackComplete.tsx`, `src/scene/layoutIds.ts`, `src/app/Providers.tsx`, `src/machine/**`, `src/platform/**`, `src/ui/**`, `src/design/**`, `content/**`. Need a change there → write it under "Requests" in your report and work around it locally with `// TODO(<your story ID>): …`.

`content/strings.*.ts`: additive only (new keys in BOTH en and nl, Dutch written naturally). Other lanes add keys too — edit with a python read-modify-write that inserts your keys just before the closing `});`, never rewrite the file wholesale, and re-read right before editing.

## How to work
- Use `mcp__remote-devices__device_bash` (repo at `$HOME/mnt/booster-cv`). Never cloud Write/Edit/Bash on project files. Each call: fresh shell, ≤180 s. Files via heredoc/python; never retype from truncated output. Never `pkill`. No `git add/commit`, no `npm install`.
- Playwright locally: `export LD_LIBRARY_PATH=$HOME/pwlibs/root/usr/lib/aarch64-linux-gnu PW_OUTPUT_DIR=/tmp/pw-out-<lane>`; wrap in `timeout 160`; chromium projects only (desktop-chromium, mobile-chromium, *-reduced). The config's webServer uses port 5173 with reuseExistingServer — fine to share across lanes. Run only your own specs (`npx playwright test e2e/<ID>`), plus `e2e/F-05.spec.ts` at the end.
- To LOOK at your work (mandatory for visual stories): start vite on your lane's port in the same call (`(timeout 120 npx vite --port 518<N> --strictPort > /tmp/vite-<lane>.log 2>&1 &); sleep 5`, A=5, B=6, C=7, D=8), drive it with a small node script that dynamic-imports `${process.env.HOME}/mnt/booster-cv/node_modules/playwright-core/index.mjs` (set `window.__BOOSTER_HOLD_MS__` via addInitScript; `?fresh`, `?state=all` or `?state=personality,craft` are dev helpers to reach states fast), screenshot into `e2e/__screens__/<ID>-<name>.png`, then `mcp__remote-devices__device_stage_files` with `/Users/pim/code/booster-cv/e2e/__screens__/...` and view the returned stagedPath with Read. Iterate until it looks right. For motion, take 3–5 frames mid-animation (screenshots at timed intervals) to judge it.
- Other lanes' slots may be stubs or half-done while you work. Your screenshots will show them; judge only your part.

## Rules (from CLAUDE.md / DESIGN-BRIEF)
- Style: Direction 1 "Print shop" (`docs/design/tokens.md`). Visual reference implementations exist in `src/dev/direction/parts/` (Card.tsx, Objects.tsx, StageMock.tsx, *.module.css) — port the look, but build on global tokens and `src/ui` primitives (`Button`, `IconButton`, `Frame`, `RarityMark`, `Badge`, `Chip`, `Kbd`, `SegmentBar`, `PMark`, `VisuallyHidden`, `SegmentedToggle`, `Toggle`).
- No copy in components (`useLocale()` from `@/platform/i18n` → `t(key, vars)`, `L(localized)`); no raw colours/durations (lint-tokens); motion numbers only from `@/design/motion` via `useMotionPrefs()` (`spring(name)`, `dur(name)`; reduced → near-zero). Framer: the app is inside `LazyMotion strict` → use `m.div` etc., never `motion.div`. Use `useAnimationTracking()` from `@/app/animationActivity` on your motion components so `data-animating` is correct. Emit events with `emit()` from `@/platform/events` ('hold:mark', 'box:open', 'pack:tear', 'card:draw', 'card:rare', 'card:collected', 'pack:complete', 'all:collected').
- Machine API: `useExperience()` → `{ state, dispatch, bundle }`, `useHoldProgress()` → MotionValue of LINEAR hold progress, selectors in `@/machine` (`holdVisual(p)` applies the curve), shared layoutIds in `@/scene/layoutIds`. Read `docs/INTERACTION-SPEC.md` (synced with the machine) — it is the behaviour contract.
- Keep the `data-testid`s and `data-slot`s that the F-05 harness uses (`e2e/helpers/app.ts`); if you must change one, change nothing — ask in Requests.
- Banned: confetti/particles, bounce on large elements, toasts, pulsing hints, auto-advance (except PackComplete's existing timed dismiss), gradients (except the holo band), blur, emoji.
- Reduced motion is a first-class path; keyboard parity for every pointer interaction.

## Done = 
`npm run typecheck` + `npx eslint <your files>` + `node scripts/lint-tokens.mjs` + `npx vitest run <your dirs>` green (ignore failures caused only by another lane's files — name them in your report), your e2e specs green on the 4 local projects, `e2e/F-05.spec.ts` still green, screenshots looked at. Then set your stories to `done` in `docs/BACKLOG.md` and append CHANGELOG lines (python, append-only).

## Report
Concise: files; public API other lanes/SC-02 need (props, exported variants, CSS vars, data attributes, events); Requests; deviations from story/spec; verification summary; screenshot paths.
