#!/usr/bin/env node
/**
 * npm run content:check — validates /content.
 *
 *   node scripts/content-check.mjs [--root <content dir>] [--stats] [--write-lock] [--no-placeholders]
 *
 *   --stats            cards per pack, rarity vs the CONTENT-WORKSHOP §3 targets, missing art,
 *                      placeholder cards (also: npm run content:stats)
 *   --write-lock       rewrite content/.ids.lock (after an intended id change)
 *   --no-placeholders  cards whose title or flavour still says "placeholder" are errors (launch)
 *
 * Runs the shared rules (src/content/rules.ts, the same ones the app's loader runs)
 * plus the node-only checks: art file ratio (5:4 ±2 %) and the .ids.lock comparison.
 * Output: `file · field · rule · message`. Exit 1 on errors, 0 on warnings only.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { imageSize } from 'image-size';
import { tsImport } from 'tsx/esm/api';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const rootIndex = args.indexOf('--root');
if (rootIndex !== -1 && !args[rootIndex + 1]) {
  console.error('--root needs a directory');
  process.exit(2);
}
const root = resolve(rootIndex === -1 ? join(repo, 'content') : args[rootIndex + 1]);
const LOCK = 'content/.ids.lock';
const ART_RATIO = 5 / 4;
const ART_TOLERANCE = 0.02;
const ART_MIN = { width: 800, height: 640 };

/** Imports a TS module through tsx and returns its default export. */
async function load(file) {
  const mod = await tsImport(pathToFileURL(file).href, import.meta.url);
  const value = mod.default;
  // tsx may wrap an ESM default once more when it treats the file as CJS
  return value && typeof value === 'object' && 'default' in value && Object.keys(value).length === 1
    ? value.default
    : value;
}

const errors = [];
const warnings = [];
const push = (list, file, field, rule, message) =>
  list.push(field ? { file, field, rule, message } : { file, rule, message });

const rules = await tsImport(pathToFileURL(join(repo, 'src/content/rules.ts')).href, import.meta.url);
const { validateContent, formatIssue } = rules;

// ── load ───────────────────────────────────────────────────────────────────
const parts = {};
for (const [key, name] of [
  ['packs', 'packs.ts'],
  ['meta', 'meta.ts'],
  ['en', 'strings.en.ts'],
  ['nl', 'strings.nl.ts'],
]) {
  const file = join(root, name);
  if (!existsSync(file)) {
    push(errors, `content/${name}`, undefined, 'file-missing', 'file does not exist');
    continue;
  }
  try {
    parts[key] = await load(file);
  } catch (error) {
    push(errors, `content/${name}`, undefined, 'load', String(error?.message ?? error));
  }
}

const cardsDir = join(root, 'cards');
const cardNames = existsSync(cardsDir)
  ? readdirSync(cardsDir)
      .filter((name) => name.endsWith('.ts') && !name.startsWith('_'))
      .sort()
  : [];
const cards = [];
const cardFiles = [];
for (const name of cardNames) {
  try {
    cards.push(await load(join(cardsDir, name)));
    cardFiles.push(`content/cards/${name}`);
  } catch (error) {
    push(errors, `content/cards/${name}`, undefined, 'load', String(error?.message ?? error));
  }
}

const artDir = join(root, 'art');
const artFiles = existsSync(artDir) ? readdirSync(artDir).filter((name) => !name.startsWith('.')) : [];

// ── shared rules ───────────────────────────────────────────────────────────
const result = validateContent({
  packs: parts.packs,
  cards,
  cardFiles,
  meta: parts.meta,
  strings: { en: parts.en, nl: parts.nl },
  artFiles,
});
errors.push(...result.errors);
warnings.push(...result.warnings);

// ── node-only: art ratio and size ──────────────────────────────────────────
const isCard = (value) => value && typeof value === 'object' && typeof value.id === 'string';
const allCards = [...cards.filter(isCard).map((card, i) => ({ card, file: cardFiles[i], prefix: '' }))];
if (isCard(parts.meta?.contactCard)) {
  allCards.push({ card: parts.meta.contactCard, file: 'content/meta.ts', prefix: 'contactCard.' });
}
for (const { card, file, prefix } of allCards) {
  if (typeof card.art !== 'string' || !artFiles.includes(card.art)) continue;
  const field = `${prefix}art`;
  try {
    const { width, height } = imageSize(readFileSync(join(artDir, card.art)));
    const ratio = width / height;
    if (Math.abs(ratio / ART_RATIO - 1) > ART_TOLERANCE) {
      push(errors, file, field, 'art-ratio', `content/art/${card.art} is ${width}×${height} (${ratio.toFixed(3)}); art must be 5:4 (1.250 ±2 %)`);
    } else if (!card.art.endsWith('.svg') && (width < ART_MIN.width || height < ART_MIN.height)) {
      push(warnings, file, field, 'art-size', `content/art/${card.art} is ${width}×${height}; at least ${ART_MIN.width}×${ART_MIN.height} is recommended`);
    }
  } catch (error) {
    push(errors, file, field, 'art-unreadable', `content/art/${card.art} could not be read as an image: ${error?.message ?? error}`);
  }
}

// ── node-only: placeholder cards ───────────────────────────────────────────
const PLACEHOLDER_TEXT = /placeholder/i;
const placeholderFields = (card) =>
  ['title', 'flavour'].flatMap((field) =>
    ['en', 'nl'].filter((locale) => PLACEHOLDER_TEXT.test(String(card?.[field]?.[locale] ?? ''))).map((locale) => `${field}.${locale}`),
  );
const placeholderCards = allCards.filter(({ card }) => placeholderFields(card).length > 0);
if (flag('--no-placeholders')) {
  for (const { card, file, prefix } of placeholderCards) {
    const fields = placeholderFields(card);
    push(errors, file, `${prefix}${fields[0]}`, 'placeholder', `"${card.id}" still has placeholder text (${fields.join(', ')}); write it before launch`);
  }
}

// ── node-only: .ids.lock ───────────────────────────────────────────────────
const lockFile = join(root, '.ids.lock');
const ids = [...new Set(allCards.map(({ card }) => card.id))].sort();
const contentVersion = parts.meta?.contentVersion;
let lockStale = false;

if (existsSync(lockFile)) {
  let lock;
  try {
    lock = JSON.parse(readFileSync(lockFile, 'utf8'));
    if (!Array.isArray(lock.ids) || typeof lock.contentVersion !== 'number') throw new Error('expected { contentVersion, ids[] }');
  } catch (error) {
    push(errors, LOCK, undefined, 'ids-lock', `unreadable lock (${error.message}); fix it or rewrite it with --write-lock`);
  }
  if (lock && Array.isArray(lock.ids)) {
    const gone = lock.ids.filter((id) => !ids.includes(id));
    const added = ids.filter((id) => !lock.ids.includes(id));
    if (gone.length > 0 && contentVersion === lock.contentVersion) {
      push(
        errors,
        'content/meta.ts',
        'contentVersion',
        'ids-lock',
        `card ${gone.map((id) => `\`${id}\``).join(', ')} removed or renamed since the lock — bump meta.contentVersion (currently ${lock.contentVersion}; persisted binders depend on it) and run content:check --write-lock, or restore the id${gone.length === 1 ? '' : 's'}`,
      );
    } else if (gone.length > 0 || added.length > 0 || contentVersion !== lock.contentVersion) {
      lockStale = true;
    }
  }
} else if (!flag('--write-lock')) {
  push(warnings, LOCK, undefined, 'ids-lock', 'no lock yet, run with --write-lock');
}

if (flag('--write-lock')) {
  if (errors.length > 0) {
    push(errors, LOCK, undefined, 'ids-lock', 'lock not written: fix the errors above first');
  } else {
    writeFileSync(lockFile, `${JSON.stringify({ contentVersion, ids }, null, 2)}\n`);
    lockStale = false;
    console.log(`wrote ${LOCK} (contentVersion ${contentVersion}, ${ids.length} ids)`);
  }
} else if (lockStale) {
  push(warnings, LOCK, undefined, 'ids-lock', 'lock is out of date (ids or contentVersion changed) — run content:check --write-lock and commit it');
}

// ── report ─────────────────────────────────────────────────────────────────
if (flag('--stats')) {
  const packs = Array.isArray(parts.packs) ? parts.packs : [];
  const byId = new Map(cards.filter(isCard).map((card) => [card.id, card]));
  const inPacks = packs.flatMap((pack) => (Array.isArray(pack?.cards) ? pack.cards : [])).map((id) => byId.get(id)).filter(Boolean);
  console.log('Cards per pack');
  for (const pack of packs) console.log(`  ${String(pack?.id).padEnd(16)} ${Array.isArray(pack?.cards) ? pack.cards.length : 0}`);
  console.log(`  ${'total'.padEnd(16)} ${inPacks.length} (+ 1 contact card)`);
  // CONTENT-WORKSHOP §3
  const targets = { common: '~55 %', uncommon: '~25 %', rare: '~15 %', holo: '1–2 cards' };
  console.log('Rarity (target from CONTENT-WORKSHOP §3)');
  for (const rarity of ['common', 'uncommon', 'rare', 'holo']) {
    const n = inPacks.filter((card) => card.rarity === rarity).length;
    const pct = inPacks.length ? Math.round((n / inPacks.length) * 100) : 0;
    console.log(`  ${rarity.padEnd(16)} ${String(n).padStart(2)}  ${String(pct).padStart(3)} %   target ${targets[rarity]}`);
  }
  const noArt = inPacks.filter((card) => card.art === null).length;
  console.log(`Missing art: ${noArt} of ${inPacks.length}`);
  const list = placeholderCards.map(({ card }) => card.id);
  console.log(`Placeholders: ${list.length} of ${allCards.length}${list.length ? ` (${list.join(', ')})` : ''}`);
  console.log('');
}

for (const issue of warnings) console.warn(`warning  ${formatIssue(issue)}`);
for (const issue of errors) console.error(`error    ${formatIssue(issue)}`);

const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const summary = `content:check — ${count(cards.length, 'card')}, ${count(errors.length, 'error')}, ${count(warnings.length, 'warning')}`;
if (errors.length > 0) {
  console.error(summary);
  process.exit(1);
}
console.log(summary);
