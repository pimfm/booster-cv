import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

// vitest runs from the repo root (jsdom replaces URL, so no import.meta.url maths here)
const script = resolve(process.cwd(), 'scripts/content-check.mjs');
const fixture = (name: string) => resolve(process.cwd(), 'src/content/__fixtures__', name);

function run(...args: string[]) {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return { status: result.status, out: `${result.stdout}\n${result.stderr}` };
}

describe('scripts/content-check.mjs', () => {
  it('passes the valid fixture', () => {
    const { status, out } = run('--root', fixture('valid'));
    expect(out).toContain('5 cards, 0 errors, 0 warnings');
    expect(status).toBe(0);
  }, 30_000);

  it.each([
    ['missing-card', 'content/packs.ts · 0.cards.3 · pack-card-missing · '],
    ['duplicate-in-packs', 'content/packs.ts · 1.cards.2 · card-in-multiple-packs · '],
    ['missing-locale', 'content/cards/beta.ts · title.nl · locale · '],
    ['title-too-long', 'content/cards/beta.ts · title.en · title-length · '],
    ['flavour-too-long', 'content/cards/gamma.ts · flavour.nl · flavour-length · '],
    ['too-many-stats', 'content/cards/delta.ts · stats · stats-max · '],
    ['art-without-alt', 'content/cards/alpha.ts · artAlt · art-alt · '],
    ['art-wrong-ratio', 'content/cards/alpha.ts · art · art-ratio · '],
    ['strings-mismatch', 'content/strings.nl.ts · left · strings-keys · '],
    ['removed-id', 'content/meta.ts · contentVersion · ids-lock · '],
  ])('fails invalid/%s with file, field and rule', (name, expected) => {
    const { status, out } = run('--root', fixture(`invalid/${name}`));
    expect(out).toContain(expected);
    expect(status).toBe(1);
  }, 30_000);

  it('hints at bumping contentVersion when an id disappears', () => {
    const { out } = run('--root', fixture('invalid/removed-id'));
    expect(out).toContain('zeta');
    expect(out).toContain('bump meta.contentVersion');
  }, 30_000);

  it('prints stats on --stats', () => {
    const { status, out } = run('--root', fixture('valid'), '--stats');
    expect(status).toBe(0);
    expect(out).toContain('Cards per pack');
    expect(out).toContain('Missing art: 5 of 5');
  }, 30_000);
});
