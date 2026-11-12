/**
 * Content types — hand-written so that content files and `define.ts` never pull in zod.
 * `schema.ts` holds the matching zod schemas and a compile-time check that both agree.
 * Spec: docs/CONTENT-AUTHORING.md §2 and §7.
 */
import type en from '../../content/strings.en';

export type Locale = 'en' | 'nl';
export type Localized = Record<Locale, string>;
export type Rarity = 'common' | 'uncommon' | 'rare' | 'holo';
export type CardKind = 'trait' | 'skill' | 'experience' | 'table' | 'contact';
export type StatValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Tint = 1 | 2 | 3 | 4 | 5;

export const LOCALES = ['en', 'nl'] as const satisfies readonly Locale[];
export const RARITIES = ['common', 'uncommon', 'rare', 'holo'] as const satisfies readonly Rarity[];
export const CARD_KINDS = [
  'trait',
  'skill',
  'experience',
  'table',
  'contact',
] as const satisfies readonly CardKind[];

export interface CardStat {
  label: Localized;
  value: StatValue;
}

export interface CardLink {
  label: Localized;
  href: string;
}

export interface Card {
  /** kebab-case, = filename, = art filename */
  id: string;
  kind: CardKind;
  rarity: Rarity;
  /** ≤ 28 chars; it has to fit the title bar */
  title: Localized;
  /** optional override of "Pack · Kind" */
  typeLine?: Localized;
  /** 1–2 lines, italic, the hook. ≤ 120 chars */
  flavour: Localized;
  /** detail view; markdown subset: paragraphs, **bold**, lists */
  body: Localized;
  /** ≤ 4 */
  stats?: CardStat[];
  /** ≤ 3, shown as chips */
  tags?: Localized[];
  /** null → designed placeholder. Else relative to content/art/ */
  art: string | null;
  /** required when art is set */
  artAlt?: Localized;
  /** detail view only */
  links?: CardLink[];
}

export interface Pack {
  id: string;
  name: Localized;
  /** one line shown under the pack on the shelf */
  blurb: Localized;
  /** picks --tint-n */
  tint: Tint;
  /** card ids, in REVEAL ORDER (authored, not random) */
  cards: string[];
}

export interface Meta {
  name: string;
  setName: Localized;
  tagline: Localized;
  contact: { email: string; links: CardLink[] };
  /** a full Card of kind 'contact'; lives here and in no pack */
  contactCard: Card;
  og: { title: Localized; description: Localized };
  /** bump when a card id is removed or renamed (persisted binders depend on it) */
  contentVersion: number;
}

/** Plural form: `{ one: 'Last one', other: '{n} left' }`. */
export interface Plural {
  one: string;
  other: string;
}
export type StringValue = string | Plural;
/** The loose shape any strings file has; `Strings` is the exact one. */
export type StringsShape = Record<string, StringValue>;

/** UI strings: exactly the keys of `content/strings.en.ts`. */
export type Strings = typeof en;
export type StringKey = keyof Strings;

export interface ContentBundle {
  /** in shelf order */
  packs: Pack[];
  /** every card that is in a pack, by id (the contact card lives in `meta.contactCard`) */
  cards: Map<string, Card>;
  meta: Meta;
  strings: Record<Locale, Strings>;
}
