# Interaction Spec — the choreography

This is the behavioural contract. Lanes implement their part of it; the reviewer agent
checks against it; SC-03 (tuning) is the only story that may change numbers, and it
changes them **here and in `src/design/motion.ts` together**.

Notation: `phase` refers to `ExperienceState.phase` in `src/machine/`. Numbers are
desktop unless a mobile value is given. "Spring X" refers to `spring.X` in motion.ts.

**Machine decisions (F-04)** that the sections below follow — the full `ExperienceState`
and `Action` types are in PLAN §5:
- There is no `pack-torn` phase. A completed tear goes straight to `revealing`; the tear
  and stack-rise animation plays *during* `revealing`, and the stack ignores input for its
  first 400 ms.
- `holdProgress` is **linear** (a time fraction 0..1). Visuals apply `holdCurve` through
  `holdVisual(p)` (`src/machine/selectors.ts`); the hold marks 0.33 / 0.66 apply to the
  linear progress. All hold fields (`holdProgress`, `holdDirection`, `holdTarget`) reset
  when a hold completes.
- `lastHoldCancelledAt` is a counter (1, 2, …) of early releases, not a timestamp.
- The machine completes holds itself (on the `HOLD_TICK` that reaches 1). The UI
  dispatches `TEAR_COMPLETE` only under reduced motion, where one press replaces the hold.
- In `all-collected` the contact card is queued; the UI dispatches `DRAW_CARD` for it
  automatically (§7).
- `RESET` → `resetting` (binder still filled, so it can fade out) → `RESET_DONE` → `sealed`.
- Card counts are derived from content, never hard-coded: `n / n` below means the total
  including the contact card (the current placeholder set: 16 cards + contact = 17).

---

## 0. Layout regions

```
┌──────────────────────────────────────────────────────┐
│ Header: name · lang EN/NL · sound · reset            │  z-chrome
├──────────────────────────────────────────────────────┤
│                                                      │
│                   STAGE  (z-stage)                   │
│   box | pack shelf | focused pack | reveal stack     │
│   stage card                                         │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Binder strip (desktop: right rail; mobile: bottom)   │  z-binder
└──────────────────────────────────────────────────────┘
```

- Desktop (≥ 900 px): binder is a right rail, 220 px wide, scrollable vertically.
- Mobile (< 900 px): binder is a bottom strip, 96 px tall, scrollable horizontally,
  expandable to a sheet (BN-03).
- Card detail (`card-detail`) is an overlay at `z-detail` that dims the stage 40 %.

## 1. `sealed` — the box

**Looks**: box centred, slightly larger than a pack, wrapped: a translucent paper-tint
overlay with a diagonal "seam" line and a small tab in the top right. Beneath the box,
one line of copy: *"Hold to open"* (strings.hold_box). On the box face: Pim's name as the
"set name", a subtitle line (strings.box_subtitle, e.g. "Booster box · 1 of 1"), and the
card count (strings.box_counts, e.g. `16 cards · 4 packs` for the placeholder set)
derived from content.

**Idle**: no motion. (Reduced-motion and sighted users see the same.)

**Hover (pointer: fine)**: box lifts by `translate(-2px,-2px)`, shadow grows from
`--shadow-1` to `--shadow-2`, `dur.sm`, `ease.out`.

**Hold** (`pointerdown` / `Space` or `Enter` keydown held):
- phase → `unwrapping`; `holdProgress` ramps **linearly** 0 → 1 over `hold.durationMs`
  (900 ms). Visuals read it through the easing
  `holdCurve(t) = t < 0.7 ? t * 0.8 : 0.56 + (t - 0.7) * 1.4667` — slow then quick, so
  the end feels like a snap. `holdVisual(holdProgress)` returns the curved value and
  every number below.
- Visual mapping of curved progress `p = holdCurve(holdProgress)`:
  - wrap seam brightness: opacity `0.4 + 0.6p`
  - box scale: `1 - 0.03p` (it compresses under the thumb)
  - wrap tab rotates `0 → -18deg` and translates up `0 → -6px`
  - at linear `holdProgress ≥ 0.33` and `≥ 0.66` a 1-frame 1px shake (`x: [0, -1, 1, 0]`, 90 ms)
    and, if audio is on, `tick` sample at 50 % volume
  - a progress ring is **not** shown; progress is read from the object itself. For
    assistive tech the live region says "Opening…" once at hold start.
- **Release before `p = 1`** (`HOLD_END`): phase → `sealed`, `holdDirection` → `'down'`;
  progress returns linearly to 0 over `hold.cancelReturnMs` (260 ms; visuals ease it with
  `ease.out`); `lastHoldCancelledAt` increments, and the copy under the box changes to
  strings.hold_not_yet (*"Not yet — keep holding."*) for 1.6 s then reverts. No sound.
- **`p` reaches 1**: the machine opens the box itself on that `HOLD_TICK` (phase →
  `box-open`, hold fields reset). The UI never dispatches `TEAR_COMPLETE` for a hold.
- **Reduced motion**: no hold. One click / Enter / Space on the box dispatches
  `TEAR_COMPLETE`, which opens it directly.

**Open sequence** (`unwrapping` → `box-open`, total ≈ 1.1 s):
1. 0 ms: wrap splits along the seam into two pieces; each flies off-stage in its
   direction with `spring.pack`, rotating ±12°, fading at the end. Sound: `tear`.
2. 120 ms: lid translates up 36 px then rotates back −70° around its far edge with
   `spring.lid`, fading to 0 at 80 % of the travel (we don't keep lids around).
3. 260 ms: packs rise out of the box in a stagger of 70 ms each (`spring.pack`),
   landing on the **pack shelf** (§2). The box body shrinks to a 48 px "tray" line
   beneath the shelf and stays as the shelf's base.
4. Copy under the shelf: strings.pick_pack (*"Pick a pack."*).

Reduced motion: wrap and lid fade out `dur.sm`; packs fade in on the shelf.

## 2. `box-open` — the pack shelf

**Looks**: packs in a row (desktop) or a 2-column grid (mobile, max 2 rows; more packs
scroll horizontally in a single row). Each pack: 150 × 230 px (mobile 128 × 196),
`--border-2`, pack tint fill, a crimped top edge drawn with a 6 px zigzag border
image, the pack name in display face, and `n cards` in `--step--1`. Opened packs are
shown **flattened**: a torn, lower-contrast silhouette with "Opened" and a checkmark
square; they are not interactive.

**Hover/focus**: lift 2 px, shadow 1 → 2. Keyboard: arrow keys move focus between packs
(roving tabindex), Enter/Space focuses the pack.

**Select** (`FOCUS_PACK`): phase → `pack-focused`.
- The selected pack moves to stage centre and scales to 1.35 with `spring.pack`, using
  `layoutId` so it travels from its shelf position.
- Other packs slide back 24 px, scale 0.92, opacity 0.6, `dur.md`.
- A back control appears top-left of the stage: strings.back_to_box ("← Box").
  `Esc` also unfocuses.
- Copy under the pack: strings.hold_pack (*"Hold to tear"*).

## 3. `pack-focused` → `pack-tearing` → `revealing`

Hold mechanics are identical to §1 (same `holdCurve`, same durations), mapped to the
pack:
- crimped top edge: a seam highlight grows from the left edge to full width with `p`
- pack skews `skewX(-1.5deg · p)` and scales `1 - 0.04p`; its content shifts 2 px down
- at the 0.33 / 0.66 marks (linear progress): the shake and `tick`
- release early: phase → `pack-focused`, relax back over 260 ms, copy → strings.hold_not_yet
- reduced motion: one press dispatches `TEAR_COMPLETE`, as for the box

**Tear** (hold reaches 1, or `TEAR_COMPLETE` under reduced motion; phase → `revealing`
at once, `queue` = the pack's uncollected cards in authored order; the beats below play
during `revealing`, ≈ 700 ms):
1. The crimped strip (top 14 %) detaches: translates `y: -40px, x: 24px`, rotates 9°,
   fades, `spring.pack`. Sound: `tear`.
2. 90 ms later the pack body drops 8 px and its opacity goes to 0.75.
3. 180 ms: the card stack slides up out of the pack mouth: cards (backs visible) rise
   40 % of their height, staggered 40 ms, each with `spring.card`, until a stack of up
   to 5 visible backs (offset 3 px/−3 px alternating) shows. If the pack has more
   than 5 cards, the stack renders 5 and the count label says the real number.
4. 400 ms: pack body fades out; stack settles centred. The stack ignores `DRAW_CARD`
   input until here (its first 400 ms in `revealing`).
   Copy: strings.tap_to_draw (*"Tap the top card"*), and `n left`.

Reduced motion: strip fades, stack fades in.

## 4. `revealing` → `card-on-stage`

**Draw** (`DRAW_CARD`: click/tap the stack, `Enter`/`Space`/`→`):
- The top back lifts 12 px, translates to stage centre-left, and **turns over by
  sliding, not rotating**: the back translates 24 px right and fades (`dur.sm`) while
  the front enters from 24 px left (`ease.out`, `dur.md`) and scales 0.96 → 1 with
  `spring.card`. Net effect: the card was turned face-up on the table.
- The remaining stack compresses by one (`dur.sm`).
- phase → `card-on-stage`. The stage card is the only thing in focus; stack dims to 0.5.
- Live region: strings.card_revealed with the title and rarity.

**Rarity beats** (one per card, selected by `card.rarity`):
- `common`: none.
- `uncommon`: title bar fill flashes to the pack tint and back, `dur.md`.
- `rare`: 350 ms pause before the front enters; stage dims 8 % during the pause; holo
  sweep runs once over the card after it lands (a 1 px-sharp band at 20° crossing in
  `dur.xl`). Sound: `rare` (a single low wood-block, not a chime).
- `holo`: as rare, plus the band re-runs on hover/tilt-free: on `pointermove` across
  the card, the band position follows the pointer x (no 3D). On touch, it follows the
  finger. Keyboard: the band runs once on focus.

**Stage card controls** (below the card, in a row, keyboard order left→right):
- strings.read_more (*"Read"*) → `OPEN_DETAIL` (§5). Also: click/tap on the card.
- strings.collect (*"Collect →"*) → `COLLECT_CARD`. Also `→`, `Enter`.
- Mobile: swipe left on the stage card is `COLLECT_CARD`; threshold 80 px; below
  threshold the card springs back (`spring.card`). Swiping right does nothing.

**Collect** (`COLLECT_CARD`, ≈ 600 ms):
- The stage card flies to its binder slot using `layoutId` (slot renders an empty
  outlined frame until then), shrinking to slot size, `spring.card`. It lands with a
  2 px overshoot and the slot's border thickens from 2 px to 3 px, `dur.sm`.
- Binder counter increments (BN-02). Sound: `slide`.
- If `queue` is non-empty: phase → `revealing`, copy → `n left` (singular form for 1:
  strings.last_in_pack *"Last one in this pack."*).
- If `queue` is empty: phase → `pack-complete` (or `all-collected` when the card was the
  contact card, §7).

## 5. `card-detail`

**Enter**: the stage card expands via `layoutId` into a centred panel: card at 1.15×
on the left (desktop) / top (mobile), text column on the right/below with the long
`body`, all `stats` as full bars with labels, tags as outlined chips. Overlay dims the
stage 40 % (`dur.md`). Focus moves into the panel; focus is trapped; `Esc`, the close
button (top-right, `×` in a square) and clicking the dimmed stage close it.

**Within detail**: strings.collect is present too, so a visitor never has to close
first. `COLLECT_CARD` from detail closes the panel and runs the collect flight from
the panel position.

**Exit**: reverse of enter, `dur.md`, focus returns to the stage card controls.

Scroll: the text column scrolls if needed; the page never scrolls.

## 6. `pack-complete`

- The empty stack area shows a small torn-pack glyph and strings.pack_done (*"Pack
  done."*) for 900 ms, then the stage returns to the shelf (`box-open`) with the opened
  pack flattened in place. `DISMISS_PACK` fires automatically after the 900 ms **or**
  on any click/key, whichever first. (This is the one timed transition; it is
  interruptible, so it does not violate "no auto-advance".)
- If every pack is now opened: phase → `all-collected` instead.

## 7. `all-collected`

- Shelf shows all packs flattened; the tray line gets a stamp *"Opened"* in the corner.
- On entering `all-collected` the machine queues the **contact card** (CT-04) unless it
  is already in the binder, and the UI dispatches `DRAW_CARD` for it automatically: it is
  drawn onto the stage as a final card (rarity `holo`, pack-less, numbered `★`). It
  behaves like any stage card, including Read (with email, links) and Collect; collecting
  it returns to `all-collected` with an empty queue, the binder is complete and its
  header says `n / n` (derived from content: currently `17 / 17`) with a filled square.
- Copy: strings.all_done (*"That's the box. Thanks for opening it."*) once the queue is
  empty.
- A text link under the stage: strings.reset (*"Reset box"*).

## 8. `resetting`

`RESET` from the header or the link opens a tiny inline confirm (no modal): *"Put the
wrap back on? Your binder empties."* with Yes/No as two buttons. The confirm is UI
state; only Yes dispatches `RESET` (phase → `resetting`; `collected` / `openedPacks` are
kept so the binder can fade out). Binder slots fade out in reverse order (`dur.xs`
stagger 20 ms, capped at 600 ms total), the shelf packs fade, the box fades back in
wrapped; then the UI dispatches `RESET_DONE` → initial state, phase `sealed`.
Persistence cleared.

## 9. Binder (all phases)

- Slots are pre-rendered for every card in content order **per pack**, grouped under a
  pack label; empty slots are dashed 2 px outlines with the card number. This shows the
  shape of the whole CV from the start without spoiling content.
- Filled slot: tiny card (title + rarity mark + art/placeholder). Click/tap → opens
  `card-detail` for that card (allowed in any phase except `unwrapping`/`pack-tearing`).
- Header: `collected / total`, pack progress as segmented bar (one segment per pack).
- Mobile: strip shows filled slots only, newest at the right end, auto-scrolled into
  view on collect; a handle (`▲ Binder`) expands it into a half-height sheet with the
  full grouped grid (BN-03).

## 10. Keyboard map

| Key | Context | Action |
|---|---|---|
| `Tab` | all | Moves through header → stage controls → binder |
| `Space`/`Enter` held | box or focused pack | Hold (progress while held) |
| `Space`/`Enter` | shelf pack focused | Focus pack |
| `Esc` | pack-focused / detail / confirm | Back / close / cancel |
| `←` `→` | shelf | Move between packs |
| `Enter` `→` | revealing | Draw card |
| `Enter` `→` | card-on-stage | Collect |
| `R` | card-on-stage | Read (detail) |
| `B` | all | Toggle binder sheet (mobile) / focus binder (desktop) |
| `M` | all | Toggle sound |
| `L` | all | Toggle language |

Shortcuts are listed in the header "?" popover (strings.shortcuts).

## 11. Hold progress — the pure function

```ts
// src/machine/hold.ts — tested in hold.test.ts
export function holdCurve(t: number): number;                   // see §1
export function advanceHold(progress: number, dtMs: number, durationMs = hold.durationMs): number;
export function relaxHold(progress: number, dtMs: number, returnMs = hold.cancelReturnMs): number;
export function crossedMark(prev: number, next: number, marks: readonly number[]): number | null;
// src/machine/selectors.ts
export function holdVisual(p: number): HoldVisual; // p = LINEAR holdProgress; applies holdCurve
```

All of these take and return **linear** progress except `holdCurve` / `holdVisual`.
`ExperienceProvider` runs the `HOLD_TICK` loop (one per animation frame, frames clamped
to 64 ms) while `holdDirection !== 'idle'`, and the reducer completes the hold on the tick
that reaches 1.

The React side drives `HOLD_TICK` from `requestAnimationFrame` while a pointer or key is
held; the machine owns progress; components only read it. Pointer cancel, `blur`,
`visibilitychange` and `pointerleave` all dispatch `HOLD_END`.

## 12. Sound map (PL-03)

| Sample | Trigger | Length | Character |
|---|---|---|---|
| `tick` | hold marks 0.33 / 0.66 | 40 ms | soft click |
| `tear` | box wrap / pack strip detaches | 350 ms | paper tear, dry |
| `slide` | card lands in binder | 180 ms | card on felt |
| `rare` | rare/holo lands | 300 ms | single wood-block |
| `done` | all-collected | 500 ms | two-note low, closed |

Master gain 0.5; opt-in; state persisted; toggle in header shows a crossed speaker
icon when off. No sound ever fires before the first user gesture.
