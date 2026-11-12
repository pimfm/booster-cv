/**
 * Shared Framer Motion `layoutId`s (AGENT-WORKFLOW §4). Use these; don't invent new ones.
 *
 * - `pack(id)`        the pack on the shelf ↔ the focused pack at stage centre
 * - `card(id)`        the stage card ↔ the card in the detail panel ↔ the card in its binder slot
 * - `binderSlot(id)`  the slot frame itself (empty outline → filled), not the card flying into it
 *
 * Mouth position contract
 * -----------------------
 * The focused pack (lane B) and the reveal stack (lane C) are separate components, but the
 * cards must rise out of the pack's mouth. So while a pack is focused, the pack writes the
 * centre of its mouth (the torn top edge) as CSS custom properties on the stage element,
 * i.e. the element with `data-slot="stage"`:
 *
 *   --mouth-x   px from the stage's left edge
 *   --mouth-y   px from the stage's top edge
 *
 * Both are plain px lengths (e.g. `412px`) relative to the stage's border box. The pack
 * updates them when it lands at stage centre and on resize, and removes them when it
 * unfocuses. The reveal stack reads them (`var(--mouth-x, 50%)`, `var(--mouth-y, 50%)`)
 * as the origin of the stack-rise; the fallback keeps it centred when no pack wrote them.
 */
export const layoutIds = {
  pack: (id: string) => `pack:${id}`,
  card: (id: string) => `card:${id}`,
  binderSlot: (id: string) => `binder-slot:${id}`,
} as const;

/** Where the mouth position contract lives. */
export const STAGE_SLOT_SELECTOR = '[data-slot="stage"]';
export const MOUTH_X_VAR = '--mouth-x';
export const MOUTH_Y_VAR = '--mouth-y';
