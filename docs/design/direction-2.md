# Direction 2 — Score pad

View it: `npm run dev`, then open `/dev/direction/2`. Tokens: `src/design/directions/direction2.css`.
Fonts: `src/design/directions/fonts2.ts` (packages `@fontsource-variable/bricolage-grotesque`,
`@fontsource/ibm-plex-sans`).

## Mood

Cool white paper ruled in deep blue ink, with tomato and mint as the two pens on the table.
It is brisker and more outspoken than the print shop: bigger type, square corners and one heavy shadow.

## Tokens

| Token | Value | Note |
|---|---|---|
| `--ink` | `#101038` | deep navy instead of black; 16.0:1 on paper |
| `--paper` | `#eef1f1` | cool off-white |
| `--paper-2` | `#dce2e6` | panels, rails, chips; ink 13.9:1 |
| `--accent-1` | `#ec4622` | tomato: primary action, focus ring, rare; ink 4.7:1 |
| `--accent-2` | `#5fd6ad` | mint: box, tray, "on" states; ink 10.2:1 |
| `--tint-1` | `#ff9079` | Personality (coral); ink 8.3:1 |
| `--tint-2` | `#86d9c0` | Craft (mint tint); ink 11.0:1 |
| `--tint-3` | `#8ec5fb` | At the table (sky); ink 10.0:1 |
| `--tint-4` | `#ffd756` | Track record (yellow); ink 13.1:1 |
| `--tint-5` | `#f5a9d0` | spare (pink); ink 9.9:1 |
| `--rarity-common` | `#c3ccd4` | stamp colour; ink 11.2:1 |
| `--rarity-uncommon` | `#5fd6ad` | stamp colour; ink 10.2:1 |
| `--rarity-rare` | `#ec4622` | stamp colour; ink 4.7:1 |
| `--rarity-holo` | `#ffd756` | stamp colour; ink 13.1:1 |
| `--radius-ui` / `--radius-card` | `0px` / `10px` | |
| `--border-1/2/3` | `2px / 3px / 4px` | unchanged |
| `--shadow-1/2` | `4px 4px 0 ink` / `8px 8px 0 ink` | unchanged |
| `--font-display` | Bricolage Grotesque Variable | weight 800, optical size auto |
| `--font-text` | IBM Plex Sans | 400/500/600 + italic |
| `--step-3` | `clamp(1.9rem, 1.4rem + 2.2vw, 3.1rem)` | larger than the base scale |
| `--step-4` | `clamp(2.4rem, 1.5rem + 4vw, 4.6rem)` | larger than the base scale |
| other steps | as `tokens.css` | |

Proposed additions:

| Token | Value | Why |
|---|---|---|
| `--ink-2` | `#45476b` | secondary text, empty slots, disabled; 7.8:1 on paper |
| `--on-accent-1` / `--on-accent-2` | ink / ink | both accents take ink text |
| `--primary` / `--on-primary` | accent-1 / ink | tomato is the action colour |
| `--shadow-0` | `2px 2px 0 ink` | icon buttons, slots, stamps |
| `--shadow-3` | `16px 16px 0 ink` | the one oversized shadow (the tray) |
| `--display-weight` / `-transform` / `-tracking` / `-leading` | 800 / none / -0.025em / 0.95 | sentence case everywhere |
| `--stage-texture` | none | plain stage |
| `--wrap` | paper at 7 % | shrink wrap |
| `--holo-band` | white at 66 % | the band |

## Why it reads professional

- Sentence case everywhere and a deep navy ink make it feel like a well-made product UI, not a poster.
- Every card has the same ink border and an ink title bar; rarity is one small stamp, so the card
  layout never changes between rarities.
- IBM Plex Sans is a quiet, technical text face that suits a software consultant's CV.
- The stage has no texture; depth comes from one 16 px shadow under the tray.

## Where restraint is applied

- Tomato is used for the primary action, the focus ring and the rare stamp only.
- Only the tray gets `--shadow-3`; nothing else goes past 8 px.
- Square UI corners and no uppercase keep the expressive face from turning playful.

## Risks

- Tomato with ink text is 4.7:1: it passes AA, but only just. Paper text on tomato fails (3.3:1),
  so tomato must always carry ink text.
- The tomato focus ring on a tomato primary button relies on the 2 px offset gap to show.
- Bricolage at 800 has quirky details (the "a", the tight joins). That works at large sizes; under
  about 18 px it starts to look busy, so card titles sit at the edge of what it can do.
- The ink title bar makes every card look the same at a glance, which suits a CV, but rarity is
  quieter than in direction 1 until the stamp is noticed.
