# Content Authoring — how Pim writes the cards

Everything the visitor reads lives in `/content`. Agents build the machine; Pim loads it.
No component may contain copy, and no card may be defined outside `/content`.

## 1. Folder

```
content/
  packs.ts              ← the packs (chapters) and the order of cards inside each
  cards/
    _template.ts        ← copy this; never imported
    patient-explainer.ts
    rules-lawyer.ts
    ...
  art/
    patient-explainer.webp   ← optional; filename = card id; 5:4, ≥ 800×640
  strings.en.ts         ← UI chrome strings (buttons, hints, live region)
  strings.nl.ts
  meta.ts               ← name, tagline, contact details, OG text, content version
```

## 2. Card schema (`src/content/schema.ts`, zod)

```ts
export type Locale = 'en' | 'nl';
export type Localized = Record<Locale, string>;
export type Rarity = 'common' | 'uncommon' | 'rare' | 'holo';
export type CardKind = 'trait' | 'skill' | 'experience' | 'table' | 'contact';

export interface Card {
  id: string;                 // kebab-case, = filename, = art filename
  kind: CardKind;
  rarity: Rarity;
  title: Localized;           // ≤ 28 chars; it has to fit the title bar
  typeLine?: Localized;       // optional override of "Pack · Kind"
  flavour: Localized;         // 1–2 lines, italic, the hook. ≤ 120 chars
  body: Localized;            // detail view; markdown subset: paragraphs, **bold**, lists
  stats?: Array<{ label: Localized; value: 0|1|2|3|4|5|6|7|8|9|10 }>;  // ≤ 4
  tags?: Localized[];         // ≤ 3, shown as chips
  art: string | null;         // null → designed placeholder. Else relative to content/art/
  artAlt?: Localized;         // required when art is set
  links?: Array<{ label: Localized; href: string }>;   // detail view only
}

export interface Pack {
  id: string;
  name: Localized;
  blurb: Localized;           // one line shown under the pack on the shelf
  tint: 1 | 2 | 3 | 4 | 5;    // picks --tint-n
  cards: string[];            // card ids, in REVEAL ORDER (authored, not random)
}
```

Rules enforced by `npm run content:check`:

- Every card id used in a pack exists, exactly once across all packs (except the
  `contact` kind card, which lives in `meta.ts` and in no pack).
- Both locales present and non-empty for every `Localized`.
- `title` ≤ 28 chars, `flavour` ≤ 120 chars, ≤ 4 stats, ≤ 3 tags.
- If `art` is set the file exists, is 5:4 (±2 %), and `artAlt` is present.
- Rarity budget warning (not error): > 25 % rare+holo prints a warning — rarity is only
  meaningful if it is rare.
- `meta.contentVersion` must change when any card id is removed or renamed (otherwise
  persisted binders break). The check compares against the committed
  `content/.ids.lock` and tells you to bump the version.

## 3. Writing a card — the template

`content/cards/_template.ts`:

```ts
import { defineCard } from '../../src/content/define';

// Copy this file, rename it to <id>.ts, and add the id to a pack in ../packs.ts —
// or let `npm run content:new -- --id <id> --pack <pack>` do all three.
// Files starting with "_" are never loaded. "Placeholder" in a title or flavour is
// counted by content:stats and fails content:check --no-placeholders.
export default defineCard({
  id: 'my-card-id',
  kind: 'trait',
  rarity: 'common',
  title:   { en: 'Placeholder title', nl: 'Placeholder titel' },
  flavour: { en: 'Placeholder: one dry line that makes someone nod.', nl: 'Placeholder: één droge zin.' },
  body: {
    en: `A paragraph or two. What this looks like in practice, with one concrete example.`,
    nl: `Een alinea of twee. Hoe dit er in de praktijk uitziet, met één concreet voorbeeld.`,
  },
  stats: [
    { label: { en: 'Patience', nl: 'Geduld' }, value: 9 },
  ],
  tags: [{ en: 'Teaching', nl: 'Uitleggen' }],
  art: null,          // drop content/art/my-card-id.webp and set to 'my-card-id.webp'
});
```

`defineCard` is an identity function that gives you autocomplete and inline type
errors; the full validation runs in `content:check` and in the dev gallery.

### Scaffold a card

```
npm run content:new -- --id rules-lawyer --pack personality --rarity uncommon
npm run content:new -- --id rules-lawyer --pack personality --after personality-02
```

| Flag | Default | Does |
|---|---|---|
| `--id <id>` | required | kebab-case; must not exist yet (card files, packs, the contact card) |
| `--pack <packId>` | required | a pack id from `packs.ts` |
| `--rarity <rarity>` | `common` | `common`, `uncommon`, `rare` or `holo` |
| `--kind <kind>` | by pack | `trait`, `skill`, `experience` or `table`; default: personality → trait, craft → skill, table → table, track-record → experience, any other pack → trait |
| `--after <cardId>` | append | insert right after that card of the same pack (reveal order) |
| `--root <dir>` | `content/` | another content folder (tests) |

It creates `content/cards/<id>.ts` from the template (id, kind and rarity filled in),
inserts the id into the pack's `cards` in `packs.ts` (keeping its formatting), prints
the new file's path and reminds you to open `/dev/cards`. It checks everything first: a
bad or duplicate id, an unknown pack or `--after` card fails (exit 1) without touching
any file.

### Check, stats, lock

```
npm run content:check                         # validate; exit 1 on errors
npm run content:stats                         # = content:check -- --stats
npm run content:check -- --write-lock         # record the current ids in content/.ids.lock
npm run content:check -- --no-placeholders    # launch check: placeholder cards are errors
```

- `--stats` prints cards per pack, the rarity distribution against the
  [CONTENT-WORKSHOP](./CONTENT-WORKSHOP.md) §3 targets (common ~55 %, uncommon ~25 %,
  rare ~15 %, holo 1–2 cards), how many cards still miss art, and the placeholder cards:
  those whose `title` or `flavour` still contains "placeholder" (any case) in either
  locale. The template starts that way on purpose.
- `--no-placeholders` turns every remaining placeholder card into an error.
- A new id makes the lock out of date (a warning): run `--write-lock` and commit it. A
  removed or renamed id is an error until you bump `meta.contentVersion` (persisted
  binders depend on it) and run `--write-lock`, or restore the id.

## 4. The dev gallery — see every card at once

`npm run dev` then open `/dev/cards`. It renders every card front at stage size and in
detail view, grouped per pack, in both locales side by side, with validation errors
inline (red border + message). Placeholder art is shown as it will ship. A `?rarity=`
filter and a `?missing=art|nl|en` filter help you finish the last ones. The gallery is
excluded from the production build.

## 5. Art slots

- Format: `.webp` (preferred) or `.png`/`.svg`, 5:4, at least 800 × 640. The build
  generates a 2× and 1× variant and lazy-loads.
- Art is framed with `--border-2` and sits on the pack tint; design art with a flat or
  simple background so it matches the brutalist frame. Photos are fine if they are
  cropped tight and high-contrast.
- You may ship with placeholders on purpose; the placeholder is a designed element
  (DESIGN-BRIEF §5), not an error state.

## 6. UI strings

`strings.en.ts` / `strings.nl.ts` export the same keys (type-checked against each
other). Keys referenced in INTERACTION-SPEC (`hold_box`, `hold_not_yet`, `pick_pack`,
`hold_pack`, `tap_to_draw`, `card_revealed`, `read_more`, `collect`, `last_in_pack`,
`pack_done`, `all_done`, `reset`, `reset_confirm`, `back_to_box`, `shortcuts`, …) are
created by F-03 with placeholder English and Dutch; Pim refines the wording.

Strings may contain `{n}` and `{title}` placeholders. Plurals use a `one`/`other`
object: `cards_left: { one: 'Last one in this pack.', other: '{n} left' }`.

## 7. meta.ts

```ts
export default defineMeta({
  name: 'Pim',
  setName: { en: 'Pim — Booster Box', nl: 'Pim — Boosterbox' },
  tagline: { en: '…', nl: '…' },
  contact: { email: '…', links: [{ label: {en:'LinkedIn', nl:'LinkedIn'}, href: '…' }] },
  contactCard: { /* a full Card of kind 'contact', rarity 'holo' */ },
  og: { title: {en:'…', nl:'…'}, description: {en:'…', nl:'…'} },
  contentVersion: 1,
});
```

## 8. Workflow for Pim

1. Draft in [CONTENT-WORKSHOP.md](./CONTENT-WORKSHOP.md) (plain text, no code).
2. `content:new` per card, paste texts, pick rarity, add stats.
3. Keep `/dev/cards` open; fix anything red.
4. Add art when you have it; `content:check` tells you what's missing.
5. Commit. CI runs `content:check`; a failing check blocks deploy.
