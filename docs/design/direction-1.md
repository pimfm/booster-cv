# Direction 1 — Print shop

View it: `npm run dev`, then open `/dev/direction/1`. Tokens: `src/design/directions/direction1.css`.
Fonts: `src/design/directions/fonts1.ts`.

## Mood

Warm paper, black ink and two spot colours, like a short print run from a letterpress studio.
It is calm and editorial: the cards carry the colour and everything around them stays quiet.

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

## Why it reads professional

- One display weight, uppercase only on section-level headings; everything on a card is sentence case.
- Colour is spent on objects (cards, packs, box) and the one action colour. Chrome is ink and paper.
- Rarity uses the frame colour, the way real trading-card sets do it, so it reads at binder size
  without any extra badge or glow.
- Placeholder art is a printer's proof: tint fill, crop mark, outlined initial, `ART` label.

## Where restraint is applied

- Shadows never exceed 8 px. The dot grid is the only texture and only on the stage.
- Cobalt appears in two places only: the focus ring and the rare frame.
- The holo band is one band (two strips) at rest, no colour shift.

## Risks

- Cream, black and mustard is a familiar "retro print" palette; it is safe rather than surprising.
- Archivo Black uppercase is heavy; used for more than headings it starts shouting.
- The rare frame (cobalt) and the focus ring (cobalt) share a colour; a focused rare card needs the
  2 px offset to keep them apart.
- Common frame (`#cdbf9f`) is close to `--paper-2`; a common card in the binder reads as "beige".
