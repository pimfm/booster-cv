/**
 * Pure bundle construction and selectors — no glob, no validation, no zod.
 * Tests and other modules build bundles from fixtures with `createBundle`.
 */
import type { Card, ContentBundle, Locale, Meta, Pack, Strings } from './types';

export interface BundleParts {
  packs: readonly Pack[];
  /** all cards from content/cards, any order */
  cards: readonly Card[];
  meta: Meta;
  strings: Record<Locale, Strings>;
}

/** The number shown on the contact card instead of a position. */
export const CONTACT_NUMBER = '★';
export type CardNumber = number | typeof CONTACT_NUMBER;

export function createBundle(parts: BundleParts): ContentBundle {
  const cards = new Map<string, Card>();
  for (const card of parts.cards) cards.set(card.id, card);
  return {
    packs: [...parts.packs],
    cards,
    meta: parts.meta,
    strings: parts.strings,
  };
}

interface Position {
  number: number;
  pack: Pack;
}

const positionCache = new WeakMap<ContentBundle, Map<string, Position>>();

/** id → global position, following pack order then in-pack order. */
function positions(bundle: ContentBundle): Map<string, Position> {
  let map = positionCache.get(bundle);
  if (!map) {
    map = new Map();
    let n = 0;
    for (const pack of bundle.packs) {
      for (const id of pack.cards) {
        if (map.has(id) || !bundle.cards.has(id)) continue;
        n += 1;
        map.set(id, { number: n, pack });
      }
    }
    positionCache.set(bundle, map);
  }
  return map;
}

export function getPack(bundle: ContentBundle, id: string): Pack | undefined {
  return bundle.packs.find((pack) => pack.id === id);
}

/** Any card by id, including the contact card. */
export function getCard(bundle: ContentBundle, id: string): Card | undefined {
  const card = bundle.cards.get(id);
  if (card) return card;
  return bundle.meta.contactCard.id === id ? bundle.meta.contactCard : undefined;
}

/** The cards of a pack in authored reveal order. Unknown pack → []. */
export function cardsInPack(bundle: ContentBundle, packId: string): Card[] {
  const pack = getPack(bundle, packId);
  if (!pack) return [];
  const out: Card[] = [];
  for (const id of pack.cards) {
    const card = bundle.cards.get(id);
    if (card) out.push(card);
  }
  return out;
}

/** Cards that sit in a pack. The contact card is not counted. */
export function totalCards(bundle: ContentBundle): number {
  return positions(bundle).size;
}

/** `totalCards` plus the contact card — the binder's full size. */
export function totalWithContact(bundle: ContentBundle): number {
  return totalCards(bundle) + 1;
}

/**
 * 1-based global number: pack order, then order inside the pack.
 * The contact card is '★'. Unknown ids (and cards in no pack) → undefined.
 */
export function cardNumber(bundle: ContentBundle, id: string): CardNumber | undefined {
  const position = positions(bundle).get(id);
  if (position) return position.number;
  return bundle.meta.contactCard.id === id ? CONTACT_NUMBER : undefined;
}

/** The pack a card belongs to. The contact card and unknown ids → undefined. */
export function packOfCard(bundle: ContentBundle, id: string): Pack | undefined {
  return positions(bundle).get(id)?.pack;
}
