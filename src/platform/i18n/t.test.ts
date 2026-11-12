import en from '../../../content/strings.en';
import nl from '../../../content/strings.nl';
import {
  detectLocale,
  interpolate,
  isLocale,
  localize,
  otherLocale,
  resolveString,
  translate,
} from './t';

describe('interpolate', () => {
  it('fills placeholders', () => {
    expect(interpolate('{a} / {b}', { a: 1, b: 'two' })).toBe('1 / two');
  });
  it('leaves unknown placeholders alone', () => {
    expect(interpolate('{a} {missing}', { a: 'x' })).toBe('x {missing}');
    expect(interpolate('{a}')).toBe('{a}');
  });
  it('does not read inherited properties', () => {
    expect(interpolate('{toString}', {})).toBe('{toString}');
  });
});

describe('resolveString', () => {
  const plural = { one: '{n} card', other: '{n} cards' };
  it('picks one for n = 1 and other otherwise', () => {
    expect(resolveString(plural, { n: 1 })).toBe('1 card');
    expect(resolveString(plural, { n: 0 })).toBe('0 cards');
    expect(resolveString(plural, { n: 4 })).toBe('4 cards');
  });
  it('falls back to other without n', () => {
    expect(resolveString(plural)).toBe('{n} cards');
  });
  it('passes plain strings through', () => {
    expect(resolveString('Hi {name}', { name: 'Pim' })).toBe('Hi Pim');
  });
});

describe('translate', () => {
  it('reads the real strings in both locales', () => {
    expect(translate(en, 'binder_progress', { collected: 3, total: 17 })).toBe('3 / 17');
    expect(translate(en, 'cards_left', { n: 1 })).toBe(en.cards_left.one);
    expect(translate(en, 'cards_left', { n: 3 })).toBe('3 left');
    expect(translate(nl, 'hold_box')).toBe(nl.hold_box);
  });
});

describe('localize / otherLocale / isLocale', () => {
  it('works', () => {
    expect(localize({ en: 'Craft', nl: 'Vak' }, 'nl')).toBe('Vak');
    expect(otherLocale('en')).toBe('nl');
    expect(otherLocale('nl')).toBe('en');
    expect(isLocale('nl')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});

describe('detectLocale', () => {
  it('prefers the query, then storage, then the browser, then en', () => {
    expect(detectLocale({ search: '?lang=nl', stored: 'en', languages: ['en-US'] })).toBe('nl');
    expect(detectLocale({ search: '?fresh', stored: 'nl', languages: ['en-US'] })).toBe('nl');
    expect(detectLocale({ search: '', stored: null, languages: ['nl-NL', 'en'] })).toBe('nl');
    expect(detectLocale({ languages: ['de-DE', 'nl-BE'] })).toBe('nl');
    expect(detectLocale({ languages: ['en-GB', 'nl'] })).toBe('en');
    expect(detectLocale({ languages: ['fr'] })).toBe('en');
    expect(detectLocale({})).toBe('en');
  });
  it('ignores junk', () => {
    expect(detectLocale({ search: '?lang=xx', stored: 'zz', languages: [] })).toBe('en');
    expect(detectLocale({ search: '?lang=NL' })).toBe('nl');
  });
});
