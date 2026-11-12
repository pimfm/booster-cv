# Final tokens — Direction 1 "Print shop"

Chosen by Pim at milestone M1 (2026-11-12). Source of truth: `src/design/tokens.css`,
mirrored in `src/design/tokens.ts` (`tokens` = `var()` references, `palette` = raw hex for
contrast tests and the OG renderer; `tokens.test.ts` keeps them in sync).

**Rule:** no story adds or changes a token. Need one? Add a `## Requests` item to your PR.

## Usage rules
- Colour is spent on objects (cards, packs, box) and on the single action colour `--primary`
  (mustard). Chrome is ink on paper.
- Cobalt (`--accent-1`) appears in exactly two places: the focus ring and the rare frame.
- Rarity is the colour of the card frame. Common cards use the beige frame — keep the card
  body `--paper`, never `--paper-2`, so commons don't disappear into the binder rail.
- Text on mustard, tints and paper is always `--ink`; text on cobalt is always `--paper`.
- Headings use `--display-transform: uppercase`; card titles and body copy are sentence case.
- The stage is the only textured surface (`--stage-texture`).
- `--holo-band` is the only translucent fill besides `--wrap`.

## Tokens
| Token | Value | Note |
|---|---|---|
| `--ink` | `#17140f` | warm near-black, 15.3:1 on paper |
| `--paper` | `#f3ead2` | warm cream |
| `--paper-2` | `#e6dbbd` | panels, rails, chips; ink 13.3:1 |
| `--accent-1` | `#2346c7` | cobalt: focus ring, rare; paper text 6.3:1 |
| `--accent-2` | `#e9b320` | mustard: primary action, box, tray; ink 9.6:1 |
| `--tint-1` | `#ee9f82` | Personality (salmon); ink 8.7:1 |
| `--tint-2` | `#8fb4e3` | Craft (sky); ink 8.6:1 |
| `--tint-3` | `#9cc8a0` | At the table (sage); ink 9.8:1 |
| `--tint-4` | `#efc958` | Track record (straw); ink 11.5:1 |
| `--tint-5` | `#bfa8e0` | spare (lilac); ink 8.7:1 |
| `--rarity-common` | `#cdbf9f` | frame colour; ink 10.1:1 |
| `--rarity-uncommon` | `#9cc8a0` | frame colour; ink 9.8:1 |
| `--rarity-rare` | `#2346c7` | frame colour = cobalt; paper 6.3:1 |
| `--rarity-holo` | `#e9b320` | frame colour = mustard; ink 9.6:1 |
| `--radius-ui` / `--radius-card` | `2px` / `12px` | |
| `--border-1/2/3` | `2px / 3px / 4px` | unchanged from the brief |
| `--shadow-1/2` | `4px 4px 0 ink` / `8px 8px 0 ink` | unchanged |
| `--font-display` | Archivo Black | one weight (400 = black) |
| `--font-text` | Inter Variable | 400–700, italic for flavour |
| `--step--1 … --step-4` | as `tokens.css` | 13–14 px to 33–57 px |

Proposed additions (D-02 decides whether they go into `tokens.css`):

| Token | Value | Why |
|---|---|---|
| `--ink-2` | `#514a3a` | secondary text, dashed empty slots, disabled; 7.3:1 on paper |
| `--on-accent-1` / `--on-accent-2` | paper / ink | text colour on each accent |
| `--primary` / `--on-primary` | accent-2 / ink | the action colour |
| `--shadow-0` | `2px 2px 0 ink` | icon buttons, binder slots |
| `--shadow-3` | `12px 12px 0 ink` | unused here; defined for parity with direction 2 |
| `--display-weight` / `-transform` / `-tracking` / `-leading` | 400 / uppercase / -0.015em / 1 | headings uppercase, card titles sentence case |
| `--stage-texture` / `-size` | 1.2 px dots, ink at 26 %, 20 px grid | the cutting mat |
| `--wrap` | paper at 7 % | the box's shrink wrap |
| `--holo-band` | white at 72 % | the single sharp band |

The "proposed additions" above are now part of `tokens.css` under "roles & extras".

## Placeholder art
Pack tint fill, a crop mark top-left, a large outlined initial of the card title (display face,
ink stroke, no fill) bottom-right, and an `ART` label bottom-left. Implemented as part of the
Card component (CR-01); the reference look is `/dev/direction/1` → Cards.

## Fonts
Archivo Black (latin, 400) for display; Inter Variable (wght + italic) for text. Self-hosted via
`@fontsource`, loaded by `src/design/fonts.ts`. Direction 2's packages
(`@fontsource-variable/bricolage-grotesque`, `@fontsource/ibm-plex-sans`) are only used by
`/dev/direction/2` and stay dev-only.
