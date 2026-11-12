import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrast, palette } from './tokens';

const css = readFileSync(resolve(process.cwd(), 'src/design/tokens.css'), 'utf8');
const cssVar = (name: string) => css.match(new RegExp(`\\n\\s*--${name}:\\s*(#[0-9a-f]{6});`, 'i'))?.[1];

const kebab: Record<keyof typeof palette, string> = {
  ink: 'ink', ink2: 'ink-2', paper: 'paper', paper2: 'paper-2', accent1: 'accent-1', accent2: 'accent-2',
  tint1: 'tint-1', tint2: 'tint-2', tint3: 'tint-3', tint4: 'tint-4', tint5: 'tint-5',
  rarityCommon: 'rarity-common', rarityUncommon: 'rarity-uncommon', rarityRare: 'rarity-rare', rarityHolo: 'rarity-holo',
};

test.each(Object.entries(kebab))('palette.%s matches tokens.css', (key, name) => {
  expect(cssVar(name)?.toLowerCase()).toBe(palette[key as keyof typeof palette]);
});

// Text pairs (≥ 4.5:1): ink text on every light surface, paper text on cobalt.
const textPairs: [string, string, string][] = [
  ['ink', 'paper', palette.paper], ['ink', 'paper-2', palette.paper2], ['ink', 'accent-2', palette.accent2],
  ['ink', 'tint-1', palette.tint1], ['ink', 'tint-2', palette.tint2], ['ink', 'tint-3', palette.tint3],
  ['ink', 'tint-4', palette.tint4], ['ink', 'tint-5', palette.tint5], ['ink', 'rarity-common', palette.rarityCommon],
];
test.each(textPairs)('%s text on %s ≥ 4.5:1', (_fg, _bg, bg) => {
  expect(contrast(palette.ink, bg)).toBeGreaterThanOrEqual(4.5);
});
test('ink-2 on paper ≥ 4.5:1 and paper on cobalt ≥ 4.5:1', () => {
  expect(contrast(palette.ink2, palette.paper)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(palette.paper, palette.accent1)).toBeGreaterThanOrEqual(4.5);
});
test('borders and focus ring ≥ 3:1 on paper', () => {
  expect(contrast(palette.ink, palette.paper)).toBeGreaterThanOrEqual(3);
  expect(contrast(palette.accent1, palette.paper)).toBeGreaterThanOrEqual(3);
});
