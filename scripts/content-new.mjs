#!/usr/bin/env node
/**
 * npm run content:new -- --id <kebab-id> --pack <packId> [--rarity common] [--kind <kind>] [--after <cardId>] [--root <content dir>]
 *
 * Creates content/cards/<id>.ts from content/cards/_template.ts (id, kind and rarity
 * filled in) and inserts the id into that pack's `cards` in content/packs.ts — appended,
 * or right after `--after`. Every check runs before anything is written: a bad id, a
 * duplicate id, an unknown pack or `--after` card changes no file. Exit 1 on those, 2 on usage.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RARITIES = ['common', 'uncommon', 'rare', 'holo'];
/** `contact` is left out on purpose: the contact card lives in meta.ts. */
export const KINDS = ['trait', 'skill', 'experience', 'table'];
/** The kind a new card gets when `--kind` is not given. */
export const DEFAULT_KIND = { personality: 'trait', craft: 'skill', table: 'table', 'track-record': 'experience' };
export const defaultKind = (packId) => DEFAULT_KIND[packId] ?? 'trait';

export class ContentNewError extends Error {}

const STRING = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;

/** Every `cards: [...]` array in packs.ts, with the pack id it belongs to and its text span. */
export function findPackArrays(source) {
  const out = [];
  const idRe = /\bid\s*:\s*(['"])([^'"]+)\1/g;
  const ids = [...source.matchAll(idRe)].map((m) => ({ id: m[2], at: m.index }));
  ids.forEach(({ id, at }, i) => {
    const limit = i + 1 < ids.length ? ids[i + 1].at : source.length;
    const cardsRe = /\bcards\s*:\s*\[/g;
    cardsRe.lastIndex = at;
    const match = cardsRe.exec(source);
    if (!match || match.index >= limit) return;
    const open = match.index + match[0].length - 1;
    const close = source.indexOf(']', open);
    if (close === -1 || close >= limit) return;
    const inner = source.slice(open + 1, close);
    const items = [...inner.matchAll(STRING)].map((m) => m[1] ?? m[2]);
    const quote = inner.includes('"') && !inner.includes("'") ? '"' : "'";
    out.push({ id, open, close, inner, items, quote });
  });
  return out;
}

const lineStart = (source, index) => source.lastIndexOf('\n', index - 1) + 1;

/** Returns packs.ts with `cardId` inserted into pack `packId` (after `after`, or last). */
export function insertIntoPack(source, packId, cardId, after) {
  const array = findPackArrays(source).find((a) => a.id === packId);
  if (!array) throw new ContentNewError(`pack "${packId}" has no cards array in packs.ts`);
  const items = [...array.items];
  let index = items.length;
  if (after !== undefined) {
    const at = items.indexOf(after);
    if (at === -1) throw new ContentNewError(`--after "${after}" is not in pack "${packId}" (${items.join(', ') || 'empty'})`);
    index = at + 1;
  }
  items.splice(index, 0, cardId);
  const q = array.quote;
  const lit = (id) => `${q}${id}${q}`;
  const ownLine = source.slice(lineStart(source, array.open), array.open);
  const baseIndent = ownLine.match(/^\s*/)[0];
  let replacement;
  if (array.inner.includes('\n')) {
    // multi-line: keep the item indent and the trailing comma style
    const itemIndent = array.inner.match(/\n([ \t]*)\S/)?.[1] ?? `${baseIndent}  `;
    const trailing = /,\s*$/.test(array.inner) ? ',' : '';
    const body = items.map((id) => `${itemIndent}${lit(id)}`).join(',\n');
    replacement = `[\n${body}${trailing}\n${baseIndent}]`;
  } else {
    replacement = `[${items.map(lit).join(', ')}]`;
    // prettier would wrap a line past 100 chars; do the same
    const lineEnd = source.indexOf('\n', array.close);
    const rest = source.slice(array.close + 1, lineEnd === -1 ? source.length : lineEnd);
    if (ownLine.length + replacement.length + rest.length > 100) {
      replacement = `[\n${items.map((id) => `${baseIndent}  ${lit(id)},`).join('\n')}\n${baseIndent}]`;
    }
  }
  return source.slice(0, array.open) + replacement + source.slice(array.close + 1);
}

/** Fills the template: id, kind, rarity, art hint; drops the "copy this file" header. */
export function fillTemplate(template, { id, kind, rarity }) {
  const lines = template.split('\n');
  const header = lines.findIndex((line) => line.startsWith('// Copy this file'));
  let text = template;
  if (header !== -1) {
    let end = header;
    while (end < lines.length && lines[end].startsWith('//')) end += 1;
    lines.splice(header, end - header, `// ${id} — created by content:new. Replace every placeholder line.`);
    text = lines.join('\n');
  }
  const set = (field, value) => {
    const re = new RegExp(`(\\b${field}\\s*:\\s*)(['"])[^'"]*\\2`);
    if (!re.test(text)) throw new ContentNewError(`_template.ts has no ${field}: '…' line`);
    text = text.replace(re, `$1$2${value}$2`);
  };
  set('id', id);
  set('kind', kind);
  set('rarity', rarity);
  return text.replaceAll('my-card-id', id);
}

export function parseArgs(argv) {
  const opts = {};
  const known = new Set(['id', 'pack', 'rarity', 'kind', 'after', 'root']);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--') || !known.has(arg.slice(2))) throw new ContentNewError(`unknown argument ${arg}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new ContentNewError(`${arg} needs a value`);
    opts[arg.slice(2)] = value;
    i += 1;
  }
  return opts;
}

/** Every card id already taken: card files, ids inside them, pack entries, the contact card. */
function takenIds(root, packsSource) {
  const taken = new Set();
  const cardsDir = join(root, 'cards');
  if (existsSync(cardsDir)) {
    for (const name of readdirSync(cardsDir)) {
      if (!name.endsWith('.ts') || name.startsWith('_')) continue;
      taken.add(name.slice(0, -3));
      const id = readFileSync(join(cardsDir, name), 'utf8').match(/\bid\s*:\s*['"]([^'"]+)['"]/)?.[1];
      if (id) taken.add(id);
    }
  }
  for (const array of findPackArrays(packsSource)) for (const id of array.items) taken.add(id);
  const metaFile = join(root, 'meta.ts');
  if (existsSync(metaFile)) {
    const contact = readFileSync(metaFile, 'utf8').match(/contactCard\s*:\s*\{[\s\S]*?\bid\s*:\s*['"]([^'"]+)['"]/)?.[1];
    if (contact) taken.add(contact);
  }
  return taken;
}

/** Validates, then writes. Returns what it did; throws ContentNewError before writing anything. */
export function contentNew(opts, log = console.log) {
  const root = resolve(opts.root ?? join(repo, 'content'));
  const { id, pack } = opts;
  const rarity = opts.rarity ?? 'common';
  if (!id) throw new ContentNewError('--id is required (kebab-case, e.g. --id rules-lawyer)');
  if (!pack) throw new ContentNewError('--pack is required (a pack id from content/packs.ts)');
  if (!KEBAB.test(id)) throw new ContentNewError(`"${id}" is not kebab-case (lowercase letters, digits, hyphens)`);
  if (!RARITIES.includes(rarity)) throw new ContentNewError(`--rarity must be one of ${RARITIES.join(', ')}`);
  const kind = opts.kind ?? defaultKind(pack);
  if (!KINDS.includes(kind)) throw new ContentNewError(`--kind must be one of ${KINDS.join(', ')} (the contact card lives in meta.ts)`);

  const packsFile = join(root, 'packs.ts');
  if (!existsSync(packsFile)) throw new ContentNewError(`${packsFile} does not exist`);
  const packsSource = readFileSync(packsFile, 'utf8');
  const packIds = findPackArrays(packsSource).map((a) => a.id);
  if (!packIds.includes(pack)) throw new ContentNewError(`unknown pack "${pack}" (packs: ${packIds.join(', ')})`);
  if (takenIds(root, packsSource).has(id)) throw new ContentNewError(`card id "${id}" already exists; pick another id`);

  const cardFile = join(root, 'cards', `${id}.ts`);
  const ownTemplate = join(root, 'cards', '_template.ts');
  const template = readFileSync(existsSync(ownTemplate) ? ownTemplate : join(repo, 'content/cards/_template.ts'), 'utf8');
  const card = fillTemplate(template, { id, kind, rarity });
  const nextPacks = insertIntoPack(packsSource, pack, id, opts.after);

  writeFileSync(cardFile, card, { flag: 'wx' });
  writeFileSync(packsFile, nextPacks);

  const shown = (file) => relative(process.cwd(), file) || file;
  const order = findPackArrays(nextPacks).find((a) => a.id === pack).items;
  log(`created ${shown(cardFile)} (${kind}, ${rarity})`);
  log(`added "${id}" to pack "${pack}" at position ${order.indexOf(id) + 1} of ${order.length}`);
  log('next: write the texts, then open /dev/cards to preview (npm run dev);');
  log('      npm run content:check -- --write-lock records the new id in content/.ids.lock');
  return { cardFile, packsFile, kind, rarity, order };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  try {
    contentNew(parseArgs(process.argv.slice(2)));
  } catch (error) {
    if (!(error instanceof ContentNewError)) throw error;
    console.error(`content:new — ${error.message}`);
    process.exit(/required|unknown argument|needs a value/.test(error.message) ? 2 : 1);
  }
}
