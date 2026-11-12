# e2e — writing a story spec

Playwright, driven through the `app` fixture. One spec file per story: `e2e/<ID>.spec.ts`
(e.g. `e2e/PK-02.spec.ts`). Journey suites are QA-01's.

```ts
import { expect, test } from './fixtures';

test('tearing a pack shows the stack', async ({ app }) => {
  await app.openBox();
  await app.focusPack('craft');
  await app.tearPack();
  expect(await app.phase()).toBe('revealing');
  await app.shot('PK-02', 'stack');
});
```

## The fixture

`app` loads `/?fresh` with an empty `localStorage` (cleared once per test, so a reload
inside the test keeps what the test stored) and `window.__BOOSTER_HOLD_MS__ = 50`.
Change the hold time per file or `describe` with `test.use({ holdMs: 600 })`.

| Helper | Does |
|---|---|
| `phase()` | `main[data-phase]` |
| `waitForPhase(p \| p[])` | polls until the phase is (one of) `p` |
| `settle()` | waits for `main[data-animating="false"]` (no tracked animation, no hold running) |
| `hold(testId)` | press-and-hold on `[data-testid]`; a single click under reduced motion |
| `holdFor(testId, ms)` | press and release after `ms` (early release when `ms < holdMs`) |
| `holdKey(testId, 'Space' \| 'Enter')` | focus + `keyboard.down` … `up`; a key press under reduced motion |
| `openBox()` | sealed → box-open |
| `focusPack(id?)` | → pack-focused; no id = first unopened pack; returns the id |
| `tearPack()` | pack-focused → revealing |
| `drawCard()` | revealing → card-on-stage (retries while the stack is entering); returns the card id |
| `openDetail()` / `closeDetail()` | card-on-stage ↔ card-detail |
| `collect()` | collects the stage card (from stage or detail); waits for the binder count |
| `collectPack()` | draws and collects until the pack is done; returns how many |
| `binderCount()` | cards in the binder |
| `shot(storyId, name)` | `settle()`, then a full-page `e2e/__screens__/<ID>-<name>-<project>.png` |
| `byTestId(id)`, `page`, `traits`, `holdMs` | escape hatches |

Helpers that move to a phase return early when the app is already there or past it, so
they compose. `app.traits` tells you the project: `{ reduced, touch }`.

How holds are driven: reduced-motion projects click (the app dispatches `TEAR_COMPLETE`);
touch projects dispatch `pointerdown` / `pointerup` with `pointerType: 'touch'`; desktop
uses `hover` + `mouse.down()` … `mouse.up()`. Each waits `holdMs + 100` ms.

## Selectors

Use `data-testid` and `data-slot`, never classes or copy (copy changes with the locale).

- Slots: `data-slot` = `shell`, `header`, `stage`, `box`, `pack-shelf` (`data-mode="shelf|focused"`),
  `reveal-stack`, `stage-card`, `pack-complete`, `card-detail`, `binder`, `live-region`.
- Test ids: `box`, `box-counts`, `pack-<packId>` (`data-count`, `data-opened`), `focused-pack`
  (`data-pack-id`), `back-to-box`, `reveal-stack` (`data-left`), `cards-left`, `stage-card`
  (`data-card-id`, `data-rarity`), `read`, `collect`, `pack-done`, `card-detail`, `card-body`,
  `close-detail`, `detail-collect`, `binder`, `binder-count` (`data-collected`, `data-total`),
  `slot-<cardId>` (`data-filled`), `lang-toggle` (`data-locale`), `reset`, `stage-copy`
  (`data-copy` = the string key shown), `live-region`.

Lanes that replace a stub keep its `data-slot` root and its test ids.

## Screenshot rule

Every visual story writes at least one `shot()` per view, on every project. Files are
named `<ID>-<view>-<project>.png` in `e2e/__screens__/`; they are reviewed, not
pixel-asserted, and CI uploads them as the `e2e-artifacts` artifact (with traces on failure).

## Projects

`desktop-chromium` (1440×900), `mobile-chromium` (Pixel 7), and `-reduced` variants of
both (`reducedMotion: 'reduce'`). `mobile-webkit` (+ `-reduced`) runs only with
`PW_WEBKIT=1` (CI, macOS). A spec must pass on all of them; use
`test.skip(app.traits.reduced, 'why')` for cases that do not exist there (e.g. early release).

## Running in a sandbox

```sh
export PW_OUTPUT_DIR=/tmp/pw-out          # some mounts hang when Playwright clears test-results
export LD_LIBRARY_PATH=…                  # where the sandbox keeps Chromium's system libraries, if not installed
timeout 150 npx playwright test           # the config starts `vite` on :5173 itself (reuses a running one locally)
npx playwright test e2e/F-05.spec.ts --project=desktop-chromium-reduced
```
