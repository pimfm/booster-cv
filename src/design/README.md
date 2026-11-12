# src/design — tokens, motion, reset

The rule (CLAUDE.md, hard rule 2): **no raw colours, durations, easings or springs
outside this folder.** `npm run lint` runs `scripts/lint-tokens.mjs`, which fails on hex
colours, `rgb()/hsl()` and (in CSS) `200ms`/`0.3s` literals anywhere else in `src/`.

> Colour values in `tokens.css` are **provisional until D-02**. The variable names are
> the contract; build against the names and the direction can change underneath you.

| File | What |
|---|---|
| `tokens.css` | CSS custom properties: colour, geometry, type, space, z, motion mirrors |
| `tokens.ts` | Typed mirror (`tokens.ink === 'var(--ink)'`), `rarityToken()`, `tintToken()` |
| `motion.ts` | `dur`, `ease`, `spring`, `hold`, `reducedTransition`, `holdDurationMs()` |
| `useMotionPrefs.ts` | The only way components read reduced-motion |
| `reset.css` | Minimal reset, body defaults, focus ring, reduced-motion CSS guard |
| `fonts.ts` | Self-hosted Archivo Black + Inter Variable (`@fontsource`) |
| `global.ts` | Imports fonts → reset → tokens. Imported once, in `src/app/main.tsx` |

## From CSS Modules

Tokens are global custom properties on `:root`; just use them.

```css
/* Button.module.css */
.button {
  padding: var(--s-2) var(--s-4);
  font: var(--step-0) / 1.2 var(--font-text);
  color: var(--ink);
  background: var(--accent-1);
  border: var(--border-1) solid var(--ink);
  border-radius: var(--radius-ui);
  box-shadow: var(--shadow-1);
  transition: transform var(--dur-xs) var(--ease-out), box-shadow var(--dur-xs) var(--ease-out);
}
.button:active {            /* neo-brutalist press: shadow → 0, move by the offset */
  transform: translate(var(--s-1), var(--s-1));
  box-shadow: none;
}
```

- Pack tint / rarity colour: set a local variable from TS and consume it in CSS, so the
  module never names a specific tint:
  `style={{ '--pack-tint': tintToken(pack.tint) } as CSSProperties}` → `background: var(--pack-tint);`
- CSS transitions need no reduced-motion handling of their own: `reset.css` neutralises
  transition/animation durations under `prefers-reduced-motion: reduce`.
- Need a value that has no token? Don't invent one — raise it as a `## Requests` item.

## From Framer Motion

Always go through `useMotionPrefs()`; never call `useReducedMotion()` directly and never
inline a spring or a duration.

```tsx
import { m } from 'framer-motion';
import { ease } from '@/design/motion';
import { tokens } from '@/design/tokens';
import { useMotionPrefs } from '@/design/useMotionPrefs';

function StageCard() {
  const { reduced, spring, dur } = useMotionPrefs();
  return (
    <m.div
      layoutId="card"
      transition={spring('card')}                       // { duration: 0.01 } when reduced
      whileHover={reduced ? {} : { boxShadow: tokens.shadow2 }}
    >
      <m.p animate={{ opacity: 1 }} transition={{ duration: dur('sm'), ease: ease.out }} />
    </m.div>
  );
}
```

- Springs for anything that settles — `settle` (UI, badges), `card`, `pack`, `lid`
  (heavier = slower). Tweens: `dur('xs'|'sm'|'md'|'lg'|'xl')` (seconds) + `ease.out`
  (enters), `ease.inOut` (moves), `ease.in` (exits).
- `reduced` is for *choosing a different path* (e.g. opacity fade instead of a layout
  move, single press instead of hold) — reduced motion is a designed path, not `return null`.
- Hold-to-open timing: `holdDurationMs()` (900; dev/test honour
  `window.__BOOSTER_HOLD_MS__`), `hold.cancelReturnMs`, `hold.thresholdHaptic`.
- Outside React (pure functions, the machine): import `dur`, `spring`, `hold` constants
  or `getSpring(name)` / `getDur(name)` from `motion.ts`.

## Tuning without a rebuild (dev/test only)

```js
window.__MOTION_OVERRIDES__ = { spring: { card: { stiffness: 300 } }, dur: { md: 0.4 } };
window.__BOOSTER_HOLD_MS__ = 50;
```

Read on each `getSpring`/`getDur`/`holdDurationMs` call (so the next render/animation
picks them up); ignored when `import.meta.env.MODE === 'production'`.

## Changing a token

Edit `tokens.css` **and** `tokens.ts` (or `motion.ts` **and** the `--dur-*`/`--ease-*`
mirrors in `tokens.css`) in the same commit. Names are additive; never rename.
