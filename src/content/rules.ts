/**
 * The authoring rules of docs/CONTENT-AUTHORING.md §2 as one pure function.
 * No fs, no glob: runs in the browser (loader, dev gallery) and in node (content:check).
 * Node-only checks (art ratio, .ids.lock) live in scripts/content-check.mjs.
 */
import type { z } from 'zod';
import { CardSchema, MetaSchema, PacksSchema, StringsSchema } from './schema';
import type { Card, Locale, Meta, Pack, StringsShape } from './types';
import { LOCALES } from './types';

export interface Issue {
  /** path relative to the repo root, e.g. `content/cards/rules-lawyer.ts` */
  file: string;
  /** dotted path inside the file's default export, e.g. `title.nl` */
  field?: string;
  /** stable rule name, e.g. `title-length` */
  rule: string;
  message: string;
}

export interface ValidateInput {
  /** default export of content/packs.ts */
  packs: unknown;
  /** default exports of content/cards/*.ts */
  cards: readonly unknown[];
  /** file of each entry in `cards` (same order). Enables the id = filename rule. */
  cardFiles?: readonly string[];
  /** default export of content/meta.ts */
  meta: unknown;
  strings: { en: unknown; nl: unknown };
  /** file names present in content/art/. Omit to skip the "art file exists" rule. */
  artFiles?: readonly string[];
}

export interface ValidationResult {
  errors: Issue[];
  warnings: Issue[];
}

export const LIMITS = {
  title: 28,
  flavour: 120,
  stats: 4,
  tags: 3,
  /** share of rare + holo above which the rarity budget warning prints */
  rareShare: 0.25,
} as const;

export const FILES = {
  packs: 'content/packs.ts',
  meta: 'content/meta.ts',
  strings: { en: 'content/strings.en.ts', nl: 'content/strings.nl.ts' },
  card: (id: string) => `content/cards/${id}.ts`,
} as const;

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER = /\{[a-zA-Z]+\}/g;

function issue(file: string, field: string | undefined, rule: string, message: string): Issue {
  return field === undefined || field === ''
    ? { file, rule, message }
    : { file, field, rule, message };
}

/** `file · field · rule · message` (field omitted when there is none). */
export function formatIssue(i: Issue): string {
  return [i.file, i.field, i.rule, i.message].filter((part) => part !== undefined).join(' · ');
}

/** One readable block for an aggregated error. */
export function formatIssues(issues: readonly Issue[]): string {
  return issues.map((i) => `  ${formatIssue(i)}`).join('\n');
}

const length = (s: string): number => [...s].length;
const join = (...parts: Array<string | number>): string => parts.filter((p) => p !== '').join('.');

function schemaIssues(file: string, error: z.ZodError, prefix = ''): Issue[] {
  return error.issues.map((zi) => {
    const path = zi.path.map((p) => String(p));
    const field = join(prefix, ...path);
    const last = path[path.length - 1];
    if (
      zi.code === 'invalid_type' &&
      (LOCALES as readonly string[]).includes(last ?? '') &&
      zi.message.includes('received undefined')
    ) {
      return issue(file, field, 'locale', `missing "${last}" text — both locales are required`);
    }
    return issue(file, field, 'schema', zi.message);
  });
}

type Out = (field: string, rule: string, message: string) => void;

function checkLocalized(value: Record<Locale, string> | undefined, field: string, out: Out): void {
  if (!value) return;
  for (const locale of LOCALES) {
    if (value[locale].trim() === '') {
      out(join(field, locale), 'locale', `"${locale}" text is empty — both locales are required`);
    }
  }
}

function checkCard(card: Card, prefix: string, artFiles: readonly string[] | undefined, out: Out): void {
  const f = (name: string) => join(prefix, name);

  if (!KEBAB.test(card.id)) {
    out(f('id'), 'id-format', `"${card.id}" is not kebab-case (lowercase letters, digits, hyphens)`);
  }

  checkLocalized(card.title, f('title'), out);
  checkLocalized(card.typeLine, f('typeLine'), out);
  checkLocalized(card.flavour, f('flavour'), out);
  checkLocalized(card.body, f('body'), out);
  checkLocalized(card.artAlt, f('artAlt'), out);
  card.stats?.forEach((stat, i) => checkLocalized(stat.label, f(`stats.${i}.label`), out));
  card.tags?.forEach((tag, i) => checkLocalized(tag, f(`tags.${i}`), out));
  card.links?.forEach((link, i) => checkLocalized(link.label, f(`links.${i}.label`), out));

  for (const locale of LOCALES) {
    const title = length(card.title[locale]);
    if (title > LIMITS.title) {
      out(f(`title.${locale}`), 'title-length', `${title} chars, max ${LIMITS.title} — it has to fit the title bar`);
    }
    const flavour = length(card.flavour[locale]);
    if (flavour > LIMITS.flavour) {
      out(f(`flavour.${locale}`), 'flavour-length', `${flavour} chars, max ${LIMITS.flavour}`);
    }
  }

  if (card.stats && card.stats.length > LIMITS.stats) {
    out(f('stats'), 'stats-max', `${card.stats.length} stats, max ${LIMITS.stats}`);
  }
  if (card.tags && card.tags.length > LIMITS.tags) {
    out(f('tags'), 'tags-max', `${card.tags.length} tags, max ${LIMITS.tags}`);
  }

  if (card.art !== null) {
    if (!card.artAlt) {
      out(f('artAlt'), 'art-alt', 'artAlt is required when art is set');
    }
    if (artFiles && !artFiles.includes(card.art)) {
      out(f('art'), 'art-missing', `content/art/${card.art} does not exist`);
    }
  }
}

function fileBase(file: string): string {
  const name = file.slice(file.lastIndexOf('/') + 1);
  return name.replace(/\.[^.]+$/, '');
}

function rawId(raw: unknown): string | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const id = (raw as { id?: unknown }).id;
  return typeof id === 'string' && id !== '' ? id : undefined;
}

function placeholders(s: string): string {
  return [...new Set(s.match(PLACEHOLDER) ?? [])].sort().join(' ');
}

function checkStrings(en: StringsShape, nl: StringsShape, errors: Issue[]): void {
  const file = FILES.strings.nl;
  for (const [locale, strings] of [['en', en], ['nl', nl]] as const) {
    for (const [key, value] of Object.entries(strings)) {
      const parts = typeof value === 'string' ? [['', value] as const] : Object.entries(value);
      for (const [form, text] of parts) {
        if (text.trim() === '') {
          errors.push(issue(FILES.strings[locale], join(key, form), 'strings-empty', 'string is empty'));
        }
      }
    }
  }
  for (const key of Object.keys(en)) {
    if (!(key in nl)) {
      errors.push(issue(file, key, 'strings-keys', `key "${key}" exists in strings.en but is missing here`));
    }
  }
  for (const key of Object.keys(nl)) {
    if (!(key in en)) {
      errors.push(issue(file, key, 'strings-keys', `key "${key}" does not exist in strings.en — remove it or add it there`));
    }
  }
  for (const [key, enValue] of Object.entries(en)) {
    const nlValue = nl[key];
    if (nlValue === undefined) continue;
    if (typeof enValue === 'string' || typeof nlValue === 'string') {
      if (typeof enValue !== typeof nlValue) {
        errors.push(
          issue(file, key, 'strings-keys', `must be a ${typeof enValue === 'string' ? 'string' : '{ one, other } plural'} like in strings.en`),
        );
      } else if (typeof enValue === 'string' && typeof nlValue === 'string') {
        comparePlaceholders(key, enValue, nlValue, errors);
      }
      continue;
    }
    // both plural: a placeholder may be absent from `one`, so compare the union of both forms
    comparePlaceholders(key, `${enValue.one} ${enValue.other}`, `${nlValue.one} ${nlValue.other}`, errors);
  }
}

function comparePlaceholders(key: string, en: string, nl: string, errors: Issue[]): void {
  const a = placeholders(en);
  const b = placeholders(nl);
  if (a !== b) {
    errors.push(
      issue(FILES.strings.nl, key, 'strings-placeholders', `placeholders differ from strings.en: expected ${a || 'none'}, found ${b || 'none'}`),
    );
  }
}

export function validateContent(input: ValidateInput): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  // ── cards ────────────────────────────────────────────────────────────────
  /** every id a card file claims, valid or not, so one broken card does not cascade */
  const knownIds = new Map<string, string>();
  const validCards = new Map<string, Card>();

  input.cards.forEach((raw, index) => {
    const id = rawId(raw);
    const file = input.cardFiles?.[index] ?? FILES.card(id ?? `#${index + 1}`);
    const out: Out = (field, rule, message) => errors.push(issue(file, field, rule, message));

    if (id !== undefined) {
      const first = knownIds.get(id);
      if (first !== undefined) {
        out('id', 'duplicate-id', `id "${id}" is already used by ${first}`);
        return;
      }
      knownIds.set(id, file);
      if (input.cardFiles?.[index] !== undefined && fileBase(file) !== id) {
        out('id', 'id-filename', `id "${id}" must equal the filename "${fileBase(file)}"`);
      }
    }

    const parsed = CardSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(...schemaIssues(file, parsed.error));
      return;
    }
    const card: Card = parsed.data;
    validCards.set(card.id, card);
    checkCard(card, '', input.artFiles, out);
    if (card.kind === 'contact') {
      out('kind', 'contact-card', `the contact card lives in ${FILES.meta} (contactCard), not in content/cards`);
    }
  });

  // ── meta ─────────────────────────────────────────────────────────────────
  let meta: Meta | undefined;
  {
    const out: Out = (field, rule, message) => errors.push(issue(FILES.meta, field, rule, message));
    const parsed = MetaSchema.safeParse(input.meta);
    if (!parsed.success) {
      errors.push(...schemaIssues(FILES.meta, parsed.error));
    } else {
      meta = parsed.data;
      checkLocalized(meta.setName, 'setName', out);
      checkLocalized(meta.tagline, 'tagline', out);
      checkLocalized(meta.og.title, 'og.title', out);
      checkLocalized(meta.og.description, 'og.description', out);
      meta.contact.links.forEach((link, i) => checkLocalized(link.label, `contact.links.${i}.label`, out));
      checkCard(meta.contactCard, 'contactCard', input.artFiles, out);
      if (meta.contactCard.kind !== 'contact') {
        out('contactCard.kind', 'contact-card', `must be "contact", found "${meta.contactCard.kind}"`);
      }
      const clash = knownIds.get(meta.contactCard.id);
      if (clash !== undefined) {
        out('contactCard.id', 'duplicate-id', `id "${meta.contactCard.id}" is already used by ${clash}`);
      }
    }
  }
  const contactId = meta?.contactCard.id ?? rawId((input.meta as { contactCard?: unknown } | null)?.contactCard);

  // ── packs ────────────────────────────────────────────────────────────────
  {
    const out: Out = (field, rule, message) => errors.push(issue(FILES.packs, field, rule, message));
    const parsed = PacksSchema.safeParse(input.packs);
    if (!parsed.success) {
      errors.push(...schemaIssues(FILES.packs, parsed.error));
    } else {
      const packs: Pack[] = parsed.data;
      const packIds = new Set<string>();
      /** card id → where it was first listed */
      const placed = new Map<string, string>();

      packs.forEach((pack, p) => {
        if (!KEBAB.test(pack.id)) {
          out(`${p}.id`, 'id-format', `"${pack.id}" is not kebab-case (lowercase letters, digits, hyphens)`);
        }
        if (packIds.has(pack.id)) out(`${p}.id`, 'duplicate-id', `pack id "${pack.id}" is used twice`);
        packIds.add(pack.id);
        checkLocalized(pack.name, `${p}.name`, out);
        checkLocalized(pack.blurb, `${p}.blurb`, out);

        pack.cards.forEach((id, c) => {
          const field = `${p}.cards.${c}`;
          if (id === contactId) {
            out(field, 'contact-card', `"${id}" is the contact card; it lives in ${FILES.meta} and in no pack`);
            return;
          }
          if (!knownIds.has(id)) {
            out(field, 'pack-card-missing', `pack "${pack.id}" lists "${id}" but ${FILES.card(id)} does not exist`);
            return;
          }
          const first = placed.get(id);
          if (first !== undefined) {
            out(field, 'card-in-multiple-packs', `"${id}" is already in pack "${first}" — a card belongs to exactly one pack`);
            return;
          }
          placed.set(id, pack.id);
        });
      });

      for (const [id, file] of knownIds) {
        if (!placed.has(id) && validCards.get(id)?.kind !== 'contact') {
          errors.push(issue(file, 'id', 'card-not-in-pack', `"${id}" is in no pack — add it to a pack in ${FILES.packs}`));
        }
      }

      // rarity budget (warning): rarity is only meaningful if it is rare
      const inPacks = [...placed.keys()].map((id) => validCards.get(id)).filter((c) => c !== undefined);
      const shiny = inPacks.filter((c) => c.rarity === 'rare' || c.rarity === 'holo').length;
      if (inPacks.length > 0 && shiny / inPacks.length > LIMITS.rareShare) {
        const pct = Math.round((shiny / inPacks.length) * 100);
        warnings.push(
          issue(FILES.packs, undefined, 'rarity-budget', `${shiny} of ${inPacks.length} cards (${pct} %) are rare or holo; keep it at ${LIMITS.rareShare * 100} % or less`),
        );
      }
    }
  }

  // ── strings ──────────────────────────────────────────────────────────────
  {
    const en = StringsSchema.safeParse(input.strings.en);
    const nl = StringsSchema.safeParse(input.strings.nl);
    if (!en.success) errors.push(...schemaIssues(FILES.strings.en, en.error));
    if (!nl.success) errors.push(...schemaIssues(FILES.strings.nl, nl.error));
    if (en.success && nl.success) checkStrings(en.data, nl.data, errors);
  }

  return { errors, warnings };
}
