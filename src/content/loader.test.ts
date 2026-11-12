import packs from '../../content/packs';
import meta from '../../content/meta';
import en from '../../content/strings.en';
import nl from '../../content/strings.nl';
import {
  ContentError,
  bundle,
  cardNumber,
  cardsInPack,
  getBundle,
  totalCards,
  totalWithContact,
} from './loader';
import { validateContent } from './rules';
import type { Card, Strings } from './types';

const cardModules = import.meta.glob<Card>(['/content/cards/*.ts', '!/content/cards/_*.ts'], {
  eager: true,
  import: 'default',
});

describe('the real placeholder content', () => {
  it('validates with zero errors and zero warnings', () => {
    const files = Object.keys(cardModules).sort();
    const result = validateContent({
      packs,
      cards: files.map((file) => cardModules[file]),
      cardFiles: files.map((file) => file.slice(1)),
      meta,
      strings: { en, nl },
      artFiles: [],
    });
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  it('loads into the bundle: 4 packs of 4, 16 cards + contact', () => {
    expect(getBundle()).toBe(bundle);
    expect(bundle.packs.map((p) => p.id)).toEqual(['personality', 'craft', 'table', 'track-record']);
    expect(bundle.packs.map((p) => p.tint)).toEqual([1, 2, 3, 4]);
    for (const pack of bundle.packs) expect(cardsInPack(bundle, pack.id)).toHaveLength(4);
    expect(totalCards(bundle)).toBe(16);
    expect(totalWithContact(bundle)).toBe(17);
    expect(bundle.cards.has('_template')).toBe(false);
    expect(bundle.cards.has('my-card-id')).toBe(false);
    expect(cardNumber(bundle, 'personality-01')).toBe(1);
    expect(cardNumber(bundle, 'track-record-04')).toBe(16);
    expect(cardNumber(bundle, bundle.meta.contactCard.id)).toBe('★');
  });

  it('has exactly 2 rare and 1 holo, and kinds follow the pack', () => {
    const cards = [...bundle.cards.values()];
    const count = (rarity: string) => cards.filter((c) => c.rarity === rarity).length;
    expect(count('rare')).toBe(2);
    expect(count('holo')).toBe(1);
    const kinds = { personality: 'trait', craft: 'skill', table: 'table', 'track-record': 'experience' } as const;
    for (const pack of bundle.packs) {
      for (const card of cardsInPack(bundle, pack.id)) {
        expect(card.kind).toBe(kinds[pack.id as keyof typeof kinds]);
        expect(card.art).toBeNull();
      }
    }
    expect(bundle.meta.contactCard).toMatchObject({ id: 'contact', kind: 'contact', rarity: 'holo' });
    expect(bundle.meta.contentVersion).toBe(1);
  });

  it('contains no lorem ipsum', () => {
    const text = JSON.stringify([[...bundle.cards.values()], bundle.meta, bundle.packs]);
    expect(text).not.toMatch(/lorem|ipsum|dolor sit/i);
  });

  it('uses the wording INTERACTION-SPEC prescribes', () => {
    const s = bundle.strings.en;
    expect(s.hold_box).toBe('Hold to open');
    expect(s.hold_not_yet).toBe('Not yet — keep holding.');
    expect(s.pick_pack).toBe('Pick a pack.');
    expect(s.hold_pack).toBe('Hold to tear');
    expect(s.tap_to_draw).toBe('Tap the top card');
    expect(s.last_in_pack).toBe('Last one in this pack.');
    expect(s.cards_left).toEqual({ one: 'Last one in this pack.', other: '{n} left' });
    expect(s.pack_done).toBe('Pack done.');
    expect(s.all_done).toBe("That's the box. Thanks for opening it.");
    expect(s.reset).toBe('Reset box');
    expect(s.reset_confirm).toBe('Put the wrap back on? Your binder empties.');
  });

  it('types Strings as plain strings, not literals, with the same keys in both locales', () => {
    const widened: Strings['hold_box'] = 'any other wording';
    expect(typeof widened).toBe('string');
    expect(Object.keys(bundle.strings.nl).sort()).toEqual(Object.keys(bundle.strings.en).sort());
  });
});

describe('ContentError', () => {
  it('aggregates every issue into one readable message', () => {
    const error = new ContentError([
      { file: 'content/cards/a.ts', field: 'title.nl', rule: 'locale', message: 'missing "nl" text' },
      { file: 'content/packs.ts', rule: 'x', message: 'y' },
    ]);
    expect(error.issues).toHaveLength(2);
    expect(error.message).toBe(
      'Content has 2 errors:\n  content/cards/a.ts · title.nl · locale · missing "nl" text\n  content/packs.ts · x · y',
    );
  });
});
