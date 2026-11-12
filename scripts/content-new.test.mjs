import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fillTemplate, findPackArrays, insertIntoPack } from './content-new.mjs';

// vitest runs from the repo root (jsdom replaces URL, so no import.meta.url maths here)
const repo = process.cwd();
const script = resolve(repo, 'scripts/content-new.mjs');
const check = resolve(repo, 'scripts/content-check.mjs');

let dir;
let root;

/** A temp copy of content/ next to a link to src/, so card imports still resolve. */
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'booster-content-'));
  root = join(dir, 'content');
  cpSync(resolve(repo, 'content'), root, { recursive: true });
  symlinkSync(resolve(repo, 'src'), join(dir, 'src'), 'dir');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const run = (file, ...args) => {
  const result = spawnSync(process.execPath, [file, ...args], { encoding: 'utf8', cwd: dir });
  return { status: result.status, out: `${result.stdout}\n${result.stderr}` };
};
const contentNew = (...args) => run(script, '--root', root, ...args);

/** Every file under content/ with its text, to prove nothing changed. */
function snapshot() {
  const files = {};
  const walk = (at) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const path = join(at, entry.name);
      if (entry.isDirectory()) walk(path);
      else files[path] = readFileSync(path, 'utf8');
    }
  };
  walk(root);
  return files;
}

const packCards = (packId) =>
  findPackArrays(readFileSync(join(root, 'packs.ts'), 'utf8')).find((a) => a.id === packId)?.items;

describe('content:new', () => {
  it('creates the card from the template and appends it to the pack', () => {
    const { status, out } = contentNew('--id', 'rules-lawyer', '--pack', 'personality', '--rarity', 'uncommon');
    expect(status).toBe(0);
    expect(out).toContain('rules-lawyer.ts');
    expect(out).toContain('/dev/cards');
    const card = readFileSync(join(root, 'cards/rules-lawyer.ts'), 'utf8');
    expect(card).toContain("id: 'rules-lawyer'");
    expect(card).toContain("kind: 'trait'");
    expect(card).toContain("rarity: 'uncommon'");
    expect(card).toContain("'rules-lawyer.webp'");
    expect(card).not.toContain('Copy this file');
    expect(packCards('personality')?.at(-1)).toBe('rules-lawyer');
  }, 30_000);

  it('defaults the kind by pack and honours --kind', () => {
    expect(contentNew('--id', 'deploys', '--pack', 'track-record').status).toBe(0);
    expect(readFileSync(join(root, 'cards/deploys.ts'), 'utf8')).toContain("kind: 'experience'");
    expect(contentNew('--id', 'teaches', '--pack', 'craft', '--kind', 'trait').status).toBe(0);
    expect(readFileSync(join(root, 'cards/teaches.ts'), 'utf8')).toContain("kind: 'trait'");
  }, 30_000);

  it('--after inserts right after that card', () => {
    expect(contentNew('--id', 'second', '--pack', 'craft', '--after', 'craft-01').status).toBe(0);
    expect(packCards('craft')).toEqual(['craft-01', 'second', 'craft-02', 'craft-03', 'craft-04']);
  }, 30_000);

  it('the generated card passes content:check', () => {
    expect(contentNew('--id', 'rules-lawyer', '--pack', 'table').status).toBe(0);
    const { status, out } = run(check, '--root', root);
    expect(out).toContain('17 cards, 0 errors');
    expect(status).toBe(0);
  }, 30_000);

  it.each([
    ['a duplicate id (twice in a row)', ['--id', 'craft-01', '--pack', 'craft'], 'already exists'],
    ['the contact card id', ['--id', 'contact', '--pack', 'craft'], 'already exists'],
    ['an unknown pack', ['--id', 'fresh-one', '--pack', 'nope'], 'unknown pack "nope"'],
    ['a bad id', ['--id', 'Not_Kebab', '--pack', 'craft'], 'not kebab-case'],
    ['an unknown --after', ['--id', 'fresh-one', '--pack', 'craft', '--after', 'table-01'], 'is not in pack "craft"'],
    ['a bad rarity', ['--id', 'fresh-one', '--pack', 'craft', '--rarity', 'mythic'], '--rarity must be'],
  ])('fails on %s without touching any file', (_name, args, message) => {
    const before = snapshot();
    const { status, out } = contentNew(...args);
    expect(status).toBe(1);
    expect(out).toContain(message);
    expect(snapshot()).toEqual(before);
  }, 30_000);

  it('running twice with the same id fails the second time and changes nothing', () => {
    expect(contentNew('--id', 'twice', '--pack', 'craft').status).toBe(0);
    const before = snapshot();
    expect(contentNew('--id', 'twice', '--pack', 'table').status).toBe(1);
    expect(snapshot()).toEqual(before);
  }, 30_000);

  it('usage errors exit 2', () => {
    expect(contentNew('--pack', 'craft').status).toBe(2);
    expect(contentNew('--id', 'x', '--pack', 'craft', '--colour', 'red').status).toBe(2);
    expect(existsSync(join(root, 'cards/x.ts'))).toBe(false);
  }, 30_000);
});

describe('content:check lock and stats (temp copy)', () => {
  it('explains a lock mismatch', () => {
    const lockFile = join(root, '.ids.lock');
    const lock = JSON.parse(readFileSync(lockFile, 'utf8'));
    writeFileSync(lockFile, JSON.stringify({ ...lock, ids: [...lock.ids, 'ghost'] }));
    const { status, out } = run(check, '--root', root);
    expect(status).toBe(1);
    expect(out).toContain('card `ghost` removed or renamed since the lock');
    expect(out).toContain(`bump meta.contentVersion (currently ${lock.contentVersion}`);
    expect(out).toContain('or restore the id');
  }, 30_000);

  it('--stats shows targets and placeholders; --no-placeholders makes them errors', () => {
    expect(contentNew('--id', 'rules-lawyer', '--pack', 'table').status).toBe(0);
    const stats = run(check, '--root', root, '--stats');
    expect(stats.status).toBe(0);
    expect(stats.out).toMatch(/common .* target ~55 %/);
    expect(stats.out).toContain('target 1–2 cards');
    expect(stats.out).toMatch(/Missing art: \d+ of 17/);
    expect(stats.out).toMatch(/Placeholders: \d+ of 18 \(.*rules-lawyer/);
    const strict = run(check, '--root', root, '--no-placeholders');
    expect(strict.status).toBe(1);
    expect(strict.out).toContain('content/cards/rules-lawyer.ts · title.en · placeholder · ');
  }, 30_000);
});

describe('insertIntoPack', () => {
  const src = `export default definePacks([
  { id: 'a', cards: ['x', 'y'] },
  {
    id: 'b',
    cards: [
      'p',
      'q',
    ],
  },
  { id: 'c', cards: [] },
]);
`;

  it('keeps single-line and multi-line formatting', () => {
    expect(insertIntoPack(src, 'a', 'z')).toContain("cards: ['x', 'y', 'z']");
    expect(insertIntoPack(src, 'b', 'r', 'p')).toContain("cards: [\n      'p',\n      'r',\n      'q',\n    ],");
    expect(insertIntoPack(src, 'c', 'n')).toContain("cards: ['n']");
  });

  it('wraps a single line that would pass 100 chars', () => {
    const long = `  { id: 'a', cards: ['${'x'.repeat(40)}', '${'y'.repeat(40)}'] },\n`;
    const out = insertIntoPack(long, 'a', 'z');
    expect(out).toContain(`cards: [\n    '${'x'.repeat(40)}',\n    '${'y'.repeat(40)}',\n    'z',\n  ] },`);
  });

  it('fills the template', () => {
    const template = readFileSync(resolve(repo, 'content/cards/_template.ts'), 'utf8');
    const out = fillTemplate(template, { id: 'abc', kind: 'skill', rarity: 'rare' });
    expect(out).toMatch(/id: 'abc',\n {2}kind: 'skill',\n {2}rarity: 'rare'/);
  });
});

describe('CONTENT-AUTHORING.md §3 matches the scripts', () => {
  const doc = readFileSync(resolve(repo, 'docs/CONTENT-AUTHORING.md'), 'utf8');
  const section = doc.slice(doc.indexOf('## 3.'), doc.indexOf('## 4.'));
  const flagsIn = (text) => new Set([...text.matchAll(/--[a-z][a-z-]+/g)].map((m) => m[0]));

  it('documents every content:new flag, and only real ones', () => {
    const newFlags = ['--id', '--pack', '--rarity', '--kind', '--after', '--root'];
    const checkFlags = ['--stats', '--write-lock', '--no-placeholders', '--root'];
    const documented = flagsIn(section);
    for (const f of [...newFlags, ...checkFlags]) expect(documented, f).toContain(f);
    for (const f of documented) expect([...newFlags, ...checkFlags], f).toContain(f);
    const implemented = flagsIn(readFileSync(script, 'utf8'));
    for (const f of newFlags) expect(implemented, f).toContain(f);
    const checkSource = readFileSync(check, 'utf8');
    for (const f of checkFlags) expect(checkSource, f).toContain(`'${f}'`);
  });
});
