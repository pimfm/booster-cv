/** Inline fixtures for the content tests. Not used by the app. */
import type { BundleParts } from './bundle';
import type { Card, Localized, Meta, Pack, Strings } from './types';
import en from '../../content/strings.en';
import nl from '../../content/strings.nl';

export const loc = (enText: string, nlText: string = enText): Localized => ({ en: enText, nl: nlText });

export function makeCard(id: string, extra: Partial<Card> = {}): Card {
  return {
    id,
    kind: 'trait',
    rarity: 'common',
    title: loc(`Card ${id}`, `Kaart ${id}`),
    flavour: loc('A fixture line.', 'Een testregel.'),
    body: loc('Fixture body.', 'Testtekst.'),
    art: null,
    ...extra,
  };
}

export function makePack(id: string, cards: string[], extra: Partial<Pack> = {}): Pack {
  return { id, name: loc(id), blurb: loc(`Pack ${id}`), tint: 1, cards, ...extra };
}

export function makeMeta(extra: Partial<Meta> = {}): Meta {
  return {
    name: 'Fixture',
    setName: loc('Fixture set', 'Testset'),
    tagline: loc('A fixture.', 'Een test.'),
    contact: { email: 'you@example.com', links: [] },
    contactCard: makeCard('contact', { kind: 'contact', rarity: 'holo' }),
    og: { title: loc('Fixture'), description: loc('Fixture.') },
    contentVersion: 1,
    ...extra,
  };
}

/** Two packs (one: a b c, two: d e), a contact card, the real strings. Fresh objects every call. */
export function makeParts(): BundleParts & { packs: Pack[]; cards: Card[] } {
  const strings: Record<'en' | 'nl', Strings> = { en, nl };
  return {
    packs: [makePack('one', ['a', 'b', 'c']), makePack('two', ['d', 'e'], { tint: 2 })],
    cards: ['a', 'b', 'c', 'd', 'e'].map((id) => makeCard(id)),
    meta: makeMeta(),
    strings,
  };
}
