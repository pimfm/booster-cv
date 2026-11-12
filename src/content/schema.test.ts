import { CardSchema, MetaSchema, PackSchema, StringsSchema } from './schema';
import { loc, makeCard, makeMeta, makePack } from './testkit';

describe('content schema', () => {
  it('accepts a minimal card and returns it unchanged', () => {
    const card = makeCard('plain');
    expect(CardSchema.parse(card)).toEqual(card);
  });

  it('accepts a card with every optional field', () => {
    const card = makeCard('full', {
      typeLine: loc('Override'),
      stats: [{ label: loc('Patience', 'Geduld'), value: 10 }],
      tags: [loc('Teaching', 'Uitleggen')],
      art: 'full.webp',
      artAlt: loc('A drawing.', 'Een tekening.'),
      links: [{ label: loc('Site'), href: 'https://example.com' }],
    });
    expect(CardSchema.parse(card)).toEqual(card);
  });

  it('accepts a pack, a meta and a strings file', () => {
    expect(PackSchema.safeParse(makePack('one', ['a'])).success).toBe(true);
    expect(MetaSchema.safeParse(makeMeta()).success).toBe(true);
    expect(StringsSchema.safeParse({ a: 'A', b: { one: '1', other: '{n}' } }).success).toBe(true);
  });

  it.each([
    ['unknown rarity', { rarity: 'mythic' }],
    ['unknown kind', { kind: 'spell' }],
    ['stat value out of range', { stats: [{ label: loc('x'), value: 11 }] }],
    ['art undefined instead of null', { art: undefined }],
    ['unknown field', { colour: 'red' }],
    ['third locale', { title: { en: 'a', nl: 'b', de: 'c' } }],
  ])('rejects a card with %s', (_name, patch) => {
    expect(CardSchema.safeParse({ ...makeCard('bad'), ...patch }).success).toBe(false);
  });

  it('rejects a pack tint outside 1–5 and a non-integer contentVersion', () => {
    expect(PackSchema.safeParse({ ...makePack('one', []), tint: 6 }).success).toBe(false);
    expect(MetaSchema.safeParse({ ...makeMeta(), contentVersion: 1.5 }).success).toBe(false);
  });
});
