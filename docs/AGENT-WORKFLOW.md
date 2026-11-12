# Agent Workflow — how a series of agents builds this coherently

Several Claude Code agents work in parallel git worktrees (work-cli style). Coherence
comes from four things: a frozen contract, file ownership, one place for numbers, and a
reviewer that is not the author.

## 1. Picking up a story

1. Read, in this order: `CLAUDE.md` (root), `docs/PLAN.md` §4–5, the story file, then
   only the sections of DESIGN-BRIEF / INTERACTION-SPEC the story links to.
2. Check `docs/BACKLOG.md`: all stories in **Depends on** must be `done` (merged to
   `main`). If not, stop and report; do not start on a stale base.
3. Create a worktree/branch: `story/<ID>-<slug>` from `main`.
4. Set the story to `in-progress` in BACKLOG.md **in your first commit** (that commit
   can be pushed early so other agents see the claim).

## 2. File ownership

A story may only create or modify files in its **Owns** list plus:

- its own tests (`*.test.ts(x)` next to the file, or `e2e/<ID>-*.spec.ts`),
- `docs/BACKLOG.md` (status column only),
- `content/strings.*.ts` — **additive only** (new keys; never rename or delete).

If you need a change outside your ownership (a new machine action, a token, a prop
on a primitive), do **not** make it. Write the request as a `## Requests` section in
your PR description, naming the owning story, and work around it locally with a
TODO(<ID>) that the reviewer will see. The owning lane picks it up as a follow-up or the
integration story (SC-02) resolves it.

Exception: Phase 0 and Phase 1 stories are serial and may touch anything they own by
design (they create the structure).

## 3. The contracts

| Contract | Owner | Change process |
|---|---|---|
| `src/machine/*` (types, reducer, selectors, hold maths) | F-04 | PR must update INTERACTION-SPEC in the same change; reviewer agent must approve; all lanes rebased after merge |
| `src/content/schema.ts` | F-03 | PR must update CONTENT-AUTHORING; `contentVersion` bump if persisted shape changes |
| `src/design/tokens.css`, `tokens.ts`, `motion.ts` | D-02 (values), SC-03 (motion values) | Any other story adding a token is a Request |
| `src/ui/*` primitives API | D-03 | Additive props allowed via Request; breaking changes need D-03 owner |
| `content/strings.*` keys | F-03 creates; everyone adds | Additive only |

## 4. How lanes integrate without touching App.tsx

`src/app/App.tsx` (owned by SC-01, then SC-02) renders slots:

```tsx
<ExperienceProvider>
  <Chrome.Header />
  <Stage>
    <Box />          {/* lane A */}
    <PackShelf />    {/* lane B */}
    <RevealStack />  {/* lane C */}
    <StageCard />    {/* lane C */}
    <CardDetail />   {/* lane C */}
  </Stage>
  <Binder />         {/* lane D */}
  <Chrome.LiveRegion />
</ExperienceProvider>
```

SC-01 lands these as **no-op components** (each returns `null` unless its phase
matches, with a `data-slot` wrapper). Lanes replace the body of their component. No
lane edits App.tsx. SC-02 wires the final composition, shared `layoutId` groups and
z-order.

Shared `layoutId` names are reserved in `src/scene/layoutIds.ts` (owned by SC-01):
`pack:<id>`, `card:<id>`, `binder-slot:<id>`. Use them; don't invent new ones.

## 5. Tests you must add

| Story type | Required |
|---|---|
| Machine / pure logic | Vitest, every transition in the story, incl. invalid actions being ignored |
| Component with motion | Vitest (RTL) for state → DOM; Playwright spec for the interaction on `desktop-chromium` and `mobile-webkit` projects; the same spec run with `reducedMotion: 'reduce'` fixture |
| Content tooling | Vitest with fixture content (valid + each invalid case) |
| Visual | Playwright screenshot named `<ID>-<view>-<viewport>.png` in `e2e/__screens__/` for the reviewer (not pixel-asserted; reviewed) |

Playwright fixtures: `e2e/fixtures.ts` exposes `openBox()`, `tearPack(id)`,
`drawCard()`, `collect()` helpers that drive hold interactions with `page.mouse.down()`
+ `page.waitForTimeout(hold.durationMs + 50)` + `up()`, and a `fastHold` flag that sets
`window.__BOOSTER_HOLD_MS__ = 50` in dev/test builds so suites stay fast. The machine
reads this override only when `import.meta.env.MODE !== 'production'`.

## 6. Pull request template

```
## <ID> <Title>

### Acceptance criteria
- [ ] … (copied from the story, each ticked with a one-line note on how it's verified)

### Screenshots (for reviewer)
desktop | mobile | reduced-motion

### Requests to other lanes
- <ID>: <what and why>  (or "none")

### Docs touched
- …  (or "none")

### Checks
npm run check ✅ · e2e desktop ✅ · e2e mobile ✅ · e2e reduced-motion ✅
```

## 7. Reviewer agent protocol

A **separate** agent (never the author) reviews every PR with motion or visuals:

1. Pull the branch, `npm run check`, `npm run e2e`.
2. Open the screenshots in `e2e/__screens__/` for this story; also run the dev server
   and record a short interaction (Playwright video) for anything with a hold or a
   flight.
3. Score against **DESIGN-BRIEF §2 (taste test)** — all five questions answered in the
   review — and against the INTERACTION-SPEC sections the story claims.
4. Check tokens discipline: `grep` the diff for raw colours (`#`, `rgb(`), raw
   durations (`ms`, `duration:`), `ease` arrays, or copy strings outside `/content`.
5. Check a11y basics: focus order, visible focus, live region message, touch target
   sizes in the mobile screenshot.
6. Leave a review: `APPROVE` with a short note, or `CHANGES` with concrete, numbered
   items referencing spec sections. Never restyle in the review; request it.

## 8. Merge order and rebasing

- Phase 0 and 1 merge in ID order.
- Phase 2 lanes merge as they finish; **rebase before merge**, run `npm run check` on
  the rebased branch.
- SC-02 (integration) starts when all four lanes are `done` and merges last in Phase 2.
- SC-03 (tuning) runs with Pim present; its PR contains only `motion.ts`,
  INTERACTION-SPEC numbers and screenshots/videos before/after.

## 9. Suggested lane assignment

With four named agents available, a natural mapping for Phase 2 is one agent per lane
(A Box & Stage, B Packs, C Cards, D Binder & Chrome). Lane C is the heaviest; if one
agent finishes early it takes CR-04 (holo pointer band) or starts PL-02 (persistence),
which has no UI dependency. Phase 3 can run as three lanes: (PL-01 i18n + PL-07 a11y),
(PL-02 persistence + PL-03 sound), (PL-04 meta/OG + PL-05 deploy), with PL-06 mobile
polish after SC-02. Phase 4 (content tooling) can start as soon as F-03 is done and
runs alongside everything.

## 10. Communication back to Pim

Each merged story appends two lines to `docs/CHANGELOG.md`: what changed for the
visitor, and anything Pim must do (e.g. "set `meta.contact.email`"). Milestone
checkpoints (PLAN §7) are explicit pauses: an agent reaching a milestone writes
`docs/checkpoints/M<n>.md` with a preview URL or run instructions and the open
questions, then stops.
