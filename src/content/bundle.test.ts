import {
  cardNumber,
  cardsInPack,
  createBundle,
  getCard,
  getPack,
  packOfCard,
  totalCards,
  totalWithContact,
} from './bundle';
import { makeParts } from './testkit';

describe('createBundle + selectors', () => {
  const parts = makeParts();
  // hand the cards over shuffled: order must come from the packs, not from the files
  const bundle = createBundle({ ...parts, cards: [...parts.cards].reverse() });

  it('builds a bundle with a card map', () => {
    expect(bundle.packs.map((p) => p.id)).toEqual(['one', 'two']);
    expect(bundle.cards).toBeInstanceOf(Map);
    expect([...bundle.cards.keys()].sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(bundle.cards.has('contact')).toBe(false);
  });

  it('getPack / getCard', () => {
    expect(getPack(bundle, 'two')?.tint).toBe(2);
    expect(getPack(bundle, 'nope')).toBeUndefined();
    expect(getCard(bundle, 'c')?.id).toBe('c');
    expect(getCard(bundle, 'contact')).toBe(bundle.meta.contactCard);
    expect(getCard(bundle, 'nope')).toBeUndefined();
  });

  it('cardsInPack follows the authored reveal order', () => {
    expect(cardsInPack(bundle, 'one').map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(cardsInPack(bundle, 'two').map((c) => c.id)).toEqual(['d', 'e']);
    expect(cardsInPack(bundle, 'nope')).toEqual([]);
  });

  it('totalCards does not count the contact card; totalWithContact does', () => {
    expect(totalCards(bundle)).toBe(5);
    expect(totalWithContact(bundle)).toBe(6);
  });

  it('cardNumber is 1-based, global, by pack order then in-pack order', () => {
    expect(['a', 'b', 'c', 'd', 'e'].map((id) => cardNumber(bundle, id))).toEqual([1, 2, 3, 4, 5]);
    expect(cardNumber(bundle, 'contact')).toBe('★');
    expect(cardNumber(bundle, 'nope')).toBeUndefined();
  });

  it('packOfCard', () => {
    expect(packOfCard(bundle, 'b')?.id).toBe('one');
    expect(packOfCard(bundle, 'e')?.id).toBe('two');
    expect(packOfCard(bundle, 'contact')).toBeUndefined();
  });

  it('numbers follow the pack order when packs are reordered', () => {
    const swapped = createBundle({ ...parts, packs: [...parts.packs].reverse() });
    expect(cardNumber(swapped, 'd')).toBe(1);
    expect(cardNumber(swapped, 'a')).toBe(3);
  });
});
