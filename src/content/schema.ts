/**
 * zod schemas for everything in /content. Spec: docs/CONTENT-AUTHORING.md §2 and §7.
 *
 * The schemas check *shape* only. Authoring rules (lengths, both locales non-empty,
 * pack membership, art, rarity budget, …) live in `rules.ts` so each one reports under
 * its own rule name.
 */
import { z } from 'zod';
import type * as T from './types';
import { CARD_KINDS, RARITIES } from './types';

export type {
  Card,
  CardKind,
  CardLink,
  CardStat,
  ContentBundle,
  Locale,
  Localized,
  Meta,
  Pack,
  Plural,
  Rarity,
  StatValue,
  StringKey,
  StringValue,
  Strings,
  StringsShape,
  Tint,
} from './types';
export { CARD_KINDS, LOCALES, RARITIES } from './types';

export const LocaleSchema = z.enum(['en', 'nl']);
export const LocalizedSchema = z.strictObject({ en: z.string(), nl: z.string() });
export const RaritySchema = z.enum(RARITIES);
export const CardKindSchema = z.enum(CARD_KINDS);

export const StatValueSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
]);
export const TintSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const CardStatSchema = z.strictObject({ label: LocalizedSchema, value: StatValueSchema });
export const CardLinkSchema = z.strictObject({ label: LocalizedSchema, href: z.string().min(1) });

export const CardSchema = z.strictObject({
  id: z.string().min(1),
  kind: CardKindSchema,
  rarity: RaritySchema,
  title: LocalizedSchema,
  typeLine: LocalizedSchema.exactOptional(),
  flavour: LocalizedSchema,
  body: LocalizedSchema,
  stats: z.array(CardStatSchema).exactOptional(),
  tags: z.array(LocalizedSchema).exactOptional(),
  art: z.string().min(1).nullable(),
  artAlt: LocalizedSchema.exactOptional(),
  links: z.array(CardLinkSchema).exactOptional(),
});

export const PackSchema = z.strictObject({
  id: z.string().min(1),
  name: LocalizedSchema,
  blurb: LocalizedSchema,
  tint: TintSchema,
  cards: z.array(z.string().min(1)),
});
export const PacksSchema = z.array(PackSchema);

export const MetaSchema = z.strictObject({
  name: z.string().min(1),
  setName: LocalizedSchema,
  tagline: LocalizedSchema,
  contact: z.strictObject({ email: z.email(), links: z.array(CardLinkSchema) }),
  contactCard: CardSchema,
  og: z.strictObject({ title: LocalizedSchema, description: LocalizedSchema }),
  contentVersion: z.number().int().min(1),
});

export const PluralSchema = z.strictObject({ one: z.string(), other: z.string() });
export const StringValueSchema = z.union([z.string(), PluralSchema]);
/** Shape of any strings file. That `nl` has exactly the keys of `en` is a rule in rules.ts. */
export const StringsSchema = z.record(z.string(), StringValueSchema);

// Compile-time guard: the zod schemas and the hand-written types in types.ts must agree.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const _schemaMatchesTypes: [
  Same<z.infer<typeof LocaleSchema>, T.Locale>,
  Same<z.infer<typeof LocalizedSchema>, T.Localized>,
  Same<z.infer<typeof RaritySchema>, T.Rarity>,
  Same<z.infer<typeof CardKindSchema>, T.CardKind>,
  Same<z.infer<typeof CardSchema>, T.Card>,
  Same<z.infer<typeof PackSchema>, T.Pack>,
  Same<z.infer<typeof MetaSchema>, T.Meta>,
  Same<z.infer<typeof StringsSchema>, T.StringsShape>,
] = [true, true, true, true, true, true, true, true];
void _schemaMatchesTypes;
