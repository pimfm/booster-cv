/**
 * Identity helpers for the files in /content: autocomplete and inline type errors,
 * nothing else. No zod in here — content files must stay cheap to import. The full
 * validation lives in `rules.ts` (run by the loader and by `npm run content:check`).
 */
import type { Card, Meta, Pack, StringsShape } from './types';

export function defineCard(card: Card): Card {
  return card;
}

export function definePack(pack: Pack): Pack {
  return pack;
}

export function definePacks(packs: Pack[]): Pack[] {
  return packs;
}

export function defineMeta(meta: Meta): Meta {
  return meta;
}

/**
 * English: `defineStrings({ ... })` — the object's keys become the `Strings` type.
 * Other locales: `defineStrings<Strings>({ ... })` — a missing or extra key is a type error.
 */
export function defineStrings<T extends StringsShape>(strings: T): T {
  return strings;
}
