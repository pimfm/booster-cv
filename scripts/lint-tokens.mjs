#!/usr/bin/env node
// lint-tokens — CLAUDE.md hard rule 2: no raw colours or durations outside src/design/.
//
// Scans src/**/*.{css,ts,tsx} (excluding src/design/** and *.test.*) for:
//   - raw hex colours (#rgb, #rgba, #rrggbb, #rrggbbaa)       .css/.ts/.tsx
//   - rgb()/rgba()/hsl()/hsla() literals                       .css/.ts/.tsx
//   - raw time literals (120ms, 0.3s)                          .css only
// Use tokens instead: src/design/tokens.css, tokens.ts, motion.ts.
// Escape hatch (use sparingly, say why): a `lint-tokens-ignore` comment on the line.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HEX = /(?<![&\w])#([0-9a-fA-F]{3,8})\b/g;
const HEX_LENGTHS = new Set([3, 4, 6, 8]);
const COLOR_FN = /\b(?:rgb|hsl)a?\(/g;
const TIME = /(?<![\w.#-])\d*\.?\d+m?s\b/g;
const EXTENSIONS = ['.css', '.ts', '.tsx'];
const IGNORE_MARK = 'lint-tokens-ignore';

/** Blank out CSS block comments, keeping line breaks so line numbers stay correct. */
function stripCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * @param {string} file  path used for reporting and to pick rules by extension
 * @param {string} text  file contents
 * @returns {{ file: string, line: number, column: number, rule: string, match: string }[]}
 */
export function scanText(file, text) {
  const isCss = file.endsWith('.css');
  const rawLines = text.split('\n');
  const lines = (isCss ? stripCssComments(text) : text).split('\n');
  const findings = [];
  lines.forEach((line, i) => {
    if ((rawLines[i] ?? '').includes(IGNORE_MARK)) return;
    const add = (rule, m) =>
      findings.push({ file, line: i + 1, column: m.index + 1, rule, match: m[0] });
    for (const m of line.matchAll(HEX)) {
      if (HEX_LENGTHS.has(m[1].length)) add('raw-hex-colour', m);
    }
    for (const m of line.matchAll(COLOR_FN)) add('raw-colour-function', m);
    if (isCss) for (const m of line.matchAll(TIME)) add('raw-time-literal', m);
  });
  return findings;
}

/** Should this path (relative to the repo root, any separator) be scanned? */
export function isScanned(relPath) {
  const p = relPath.split(sep).join('/');
  if (!p.startsWith('src/')) return false;
  if (p.startsWith('src/design/')) return false;
  if (/\.test\.[^/]+$/.test(p)) return false;
  if (p.endsWith('.d.ts')) return false;
  return EXTENSIONS.some((ext) => p.endsWith(ext));
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

export function scanRepo(root) {
  const files = walk(join(root, 'src'))
    .map((full) => ({ full, rel: relative(root, full).split(sep).join('/') }))
    .filter(({ rel }) => isScanned(rel))
    .sort((a, b) => a.rel.localeCompare(b.rel));
  const findings = files.flatMap(({ full, rel }) => scanText(rel, readFileSync(full, 'utf8')));
  return { fileCount: files.length, findings };
}

const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const { fileCount, findings } = scanRepo(root);
  if (findings.length > 0) {
    for (const f of findings) {
      console.error(`${f.file}:${f.line}:${f.column}  ${f.rule}  ${f.match}`);
    }
    console.error(
      `\nlint-tokens: ${findings.length} raw value(s) in ${fileCount} file(s) scanned. ` +
        'Use tokens from src/design (tokens.css, tokens.ts, motion.ts).',
    );
    process.exit(1);
  }
  console.log(`lint-tokens: OK — ${fileCount} file(s) scanned, no raw colours or durations.`);
}
