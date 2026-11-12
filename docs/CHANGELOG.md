# Changelog

## Unreleased

- F-01: project scaffold (Vite, React, TypeScript strict, Vitest, Playwright, ESLint, CI).
- F-02: design skeleton — tokens.css / tokens.ts, motion.ts, reset, fonts, `useMotionPrefs`, lint-tokens.
- F-03: content schema, `define*`, loader, placeholder set (16 cards + contact), strings, `content:check`.
- F-04: experience state machine, linear hold maths, `ExperienceProvider` with the hold loop.
- F-05: Playwright harness — `app` fixture (hold, draw, collect, detail, screenshot helpers), 4 local projects, `e2e/README.md`.
- F-06: app shell with slots, functional stand-in components, i18n (`useLocale`, `t`, `L`), event bus, live-region announcements, `data-animating`, `layoutIds`.
- Docs: INTERACTION-SPEC and PLAN §5 synced with the F-04 machine (no `pack-torn`, linear hold, `RESET_DONE`, derived counts).
- D-01: two style tiles at `/dev/direction/1` (Print shop) and `/2` (Score pad).
- D-02: Pim chose Direction 1 "Print shop" — warm cream, near-black ink, mustard action, cobalt for focus and rares; Archivo Black + Inter. Final tokens in `src/design/tokens.css`, documented in `docs/design/tokens.md`.
