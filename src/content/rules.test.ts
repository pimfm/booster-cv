import { formatIssue, validateContent } from './rules';
import type { Issue, ValidateInput } from './rules';
import { loc, makeCard, makeParts } from './testkit';

function input(patch: (parts: ReturnType<typeof makeParts>) => void = () => {}): ValidateInput {
  const parts = makeParts();
  patch(parts);
  return {
    packs: parts.packs,
    cards: parts.cards,
    meta: parts.meta,
    strings: { en: { hello: 'Hello {name}', left: { one: 'Last', other: '{n} left' } }, nl: { hello: 'Hallo {name}', left: { one: 'Laatste', other: 'Nog {n}' } } },
    artFiles: [],
  };
}

const rulesOf = (issues: Issue[]) => issues.map((i) => i.rule);

describe('validateContent', () => {
  it('passes a valid set with no errors and no warnings', () => {
    expect(validateContent(input())).toEqual({ errors: [], warnings: [] });
  });

  it('reports a pack card that does not exist', () => {
    const { errors } = validateContent(input((p) => p.packs[0]?.cards.push('ghost')));
    expect(errors).toEqual([
      expect.objectContaining({ file: 'content/packs.ts', field: '0.cards.3', rule: 'pack-card-missing' }),
    ]);
  });

  it('reports a card id used in two packs', () => {
    const { errors } = validateContent(input((p) => p.packs[1]?.cards.push('a')));
    expect(errors).toEqual([
      expect.objectContaining({ file: 'content/packs.ts', field: '1.cards.2', rule: 'card-in-multiple-packs' }),
    ]);
  });

  it('reports a card listed twice in the same pack', () => {
    const { errors } = validateContent(input((p) => p.packs[0]?.cards.push('a')));
    expect(rulesOf(errors)).toEqual(['card-in-multiple-packs']);
  });

  it('reports a card that is in no pack', () => {
    const { errors } = validateContent(input((p) => p.cards.push(makeCard('orphan'))));
    expect(errors).toEqual([
      expect.objectContaining({ file: 'content/cards/orphan.ts', rule: 'card-not-in-pack' }),
    ]);
  });

  it('reports two card files with the same id', () => {
    const { errors } = validateContent(input((p) => p.cards.push(makeCard('a'))));
    expect(rulesOf(errors)).toEqual(['duplicate-id']);
  });

  it('keeps the contact card out of packs and out of content/cards', () => {
    const inPack = validateContent(input((p) => p.packs[0]?.cards.push('contact')));
    expect(rulesOf(inPack.errors)).toEqual(['contact-card']);

    const asFile = validateContent(
      input((p) => {
        p.cards.push(makeCard('hello', { kind: 'contact' }));
        p.packs[0]?.cards.push('hello');
      }),
    );
    expect(rulesOf(asFile.errors)).toEqual(['contact-card']);

    const wrongKind = validateContent(input((p) => (p.meta.contactCard.kind = 'trait')));
    expect(wrongKind.errors).toEqual([
      expect.objectContaining({ file: 'content/meta.ts', field: 'contactCard.kind', rule: 'contact-card' }),
    ]);
  });

  it('reports a missing locale', () => {
    const base = input();
    const broken = { ...makeCard('a'), title: { en: 'Only English' } };
    const { errors } = validateContent({ ...base, cards: [broken, ...base.cards.slice(1)] });
    expect(errors).toEqual([
      expect.objectContaining({ file: 'content/cards/a.ts', field: 'title.nl', rule: 'locale' }),
    ]);
  });

  it('reports an empty locale, also in stats, tags and packs', () => {
    const { errors } = validateContent(
      input((p) => {
        const card = p.cards[0];
        if (!card) return;
        card.body = loc('Body', '   ');
        card.stats = [{ label: loc('Patience', ''), value: 3 }];
        card.tags = [loc('', 'Label')];
        const pack = p.packs[1];
        if (pack) pack.blurb = loc('Blurb', '');
      }),
    );
    expect(errors.map((i) => `${i.file}:${i.field}:${i.rule}`).sort()).toEqual([
      'content/cards/a.ts:body.nl:locale',
      'content/cards/a.ts:stats.0.label.nl:locale',
      'content/cards/a.ts:tags.0.en:locale',
      'content/packs.ts:1.blurb.nl:locale',
    ]);
  });

  it('enforces title ≤ 28 and flavour ≤ 120, per locale', () => {
    const ok = validateContent(
      input((p) => {
        const card = p.cards[0];
        if (card) {
          card.title = loc('x'.repeat(28));
          card.flavour = loc('y'.repeat(120));
        }
      }),
    );
    expect(ok.errors).toEqual([]);

    const { errors } = validateContent(
      input((p) => {
        const card = p.cards[0];
        if (card) {
          card.title = loc('Fine', 'x'.repeat(29));
          card.flavour = loc('y'.repeat(121), 'Prima');
        }
      }),
    );
    expect(errors).toEqual([
      expect.objectContaining({ field: 'flavour.en', rule: 'flavour-length' }),
      expect.objectContaining({ field: 'title.nl', rule: 'title-length' }),
    ]);
  });

  it('allows 4 stats and 3 tags, not 5 and 4', () => {
    const stat = (n: number) => ({ label: loc(`Stat ${n}`), value: 5 as const });
    const tag = (n: number) => loc(`Tag ${n}`);
    const ok = validateContent(
      input((p) => {
        const card = p.cards[0];
        if (card) {
          card.stats = [1, 2, 3, 4].map(stat);
          card.tags = [1, 2, 3].map(tag);
        }
      }),
    );
    expect(ok.errors).toEqual([]);

    const { errors } = validateContent(
      input((p) => {
        const card = p.cards[0];
        if (card) {
          card.stats = [1, 2, 3, 4, 5].map(stat);
          card.tags = [1, 2, 3, 4].map(tag);
        }
      }),
    );
    expect(rulesOf(errors)).toEqual(['stats-max', 'tags-max']);
  });

  it('requires artAlt and an existing file when art is set', () => {
    const withArt = (alt: boolean) =>
      input((p) => {
        const card = p.cards[0];
        if (card) {
          card.art = 'a.webp';
          if (alt) card.artAlt = loc('A drawing.', 'Een tekening.');
        }
      });

    expect(rulesOf(validateContent(withArt(false)).errors)).toEqual(['art-alt', 'art-missing']);
    expect(rulesOf(validateContent(withArt(true)).errors)).toEqual(['art-missing']);
    expect(validateContent({ ...withArt(true), artFiles: ['a.webp'] }).errors).toEqual([]);

    // without a file list (e.g. somewhere fs is unknown) existence is not checked
    const { artFiles: _artFiles, ...noList } = withArt(true);
    expect(validateContent(noList).errors).toEqual([]);
  });

  it('warns, without failing, when more than 25 % is rare or holo', () => {
    const shiny = (n: number) =>
      validateContent(
        input((p) => {
          p.cards.slice(0, n).forEach((card, i) => (card.rarity = i === 0 ? 'holo' : 'rare'));
        }),
      );
    // 1 of 5 = 20 %
    expect(shiny(1).warnings).toEqual([]);
    // 2 of 5 = 40 %
    const result = shiny(2);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      expect.objectContaining({ file: 'content/packs.ts', rule: 'rarity-budget' }),
    ]);
  });

  it('requires strings.nl to have exactly the keys of strings.en', () => {
    const base = input();
    const { errors } = validateContent({
      ...base,
      strings: { en: { a: 'A', b: 'B', c: { one: '1', other: '{n}' } }, nl: { a: 'A', c: 'C {n}', d: 'D' } },
    });
    expect(errors.map((i) => `${i.file}:${i.field}:${i.rule}`).sort()).toEqual([
      'content/strings.nl.ts:b:strings-keys',
      'content/strings.nl.ts:c:strings-keys',
      'content/strings.nl.ts:d:strings-keys',
    ]);
  });

  it('requires the same {placeholders} in both locales', () => {
    const base = input();
    const { errors } = validateContent({
      ...base,
      strings: { en: { a: '{n} of {total}', b: { one: 'Last', other: '{n} left' } }, nl: { a: '{n} van de', b: { one: 'Laatste', other: 'Nog een paar' } } },
    });
    expect(errors.map((i) => `${i.field}:${i.rule}`)).toEqual(['a:strings-placeholders', 'b:strings-placeholders']);
  });

  it('reports schema problems with file and field, and does not cascade', () => {
    const base = input();
    const broken = { ...makeCard('a'), rarity: 'mythic' };
    const { errors } = validateContent({ ...base, cards: [broken, ...base.cards.slice(1)] });
    expect(errors).toEqual([
      expect.objectContaining({ file: 'content/cards/a.ts', field: 'rarity', rule: 'schema' }),
    ]);
  });

  it('checks the id against the filename when files are given', () => {
    const base = input();
    const files = base.cards.map((_, i) => `content/cards/${['a', 'b', 'c', 'd', 'renamed'][i]}.ts`);
    const { errors } = validateContent({ ...base, cardFiles: files });
    expect(errors).toEqual([
      expect.objectContaining({ file: 'content/cards/renamed.ts', field: 'id', rule: 'id-filename' }),
    ]);
  });

  it('formats an issue as file · field · rule · message', () => {
    expect(formatIssue({ file: 'f.ts', field: 'a.b', rule: 'r', message: 'm' })).toBe('f.ts · a.b · r · m');
    expect(formatIssue({ file: 'f.ts', rule: 'r', message: 'm' })).toBe('f.ts · r · m');
  });
});
