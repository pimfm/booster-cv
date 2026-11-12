/**
 * Loads /content into one validated ContentBundle.
 * Dev and test: throws one readable, aggregated error when the content breaks a rule.
 * Production: logs and continues (CI's content:check is the gate; a typo must not blank the page).
 */
import packsModule from '../../content/packs';
import metaModule from '../../content/meta';
import en from '../../content/strings.en';
import nl from '../../content/strings.nl';
import { createBundle } from './bundle';
import { formatIssues, validateContent } from './rules';
import type { Issue } from './rules';
import type { Card, ContentBundle } from './types';

export {
  CONTACT_NUMBER,
  cardNumber,
  cardsInPack,
  createBundle,
  getCard,
  getPack,
  packOfCard,
  totalCards,
  totalWithContact,
} from './bundle';
export type { BundleParts, CardNumber } from './bundle';

const cardModules = import.meta.glob<Card>(['/content/cards/*.ts', '!/content/cards/_*.ts'], {
  eager: true,
  import: 'default',
});
// keys only — nothing is loaded; used for the "art file exists" rule
const artModules = import.meta.glob('/content/art/*.{webp,png,svg,jpg,jpeg,avif}');

const stripSlash = (path: string): string => path.replace(/^\//, '');
const baseName = (path: string): string => path.slice(path.lastIndexOf('/') + 1);

export class ContentError extends Error {
  readonly issues: Issue[];
  constructor(issues: Issue[]) {
    super(`Content has ${issues.length} error${issues.length === 1 ? '' : 's'}:\n${formatIssues(issues)}`);
    this.name = 'ContentError';
    this.issues = issues;
  }
}

function load(): ContentBundle {
  const files = Object.keys(cardModules).sort();
  const cards = files.map((file) => cardModules[file]).filter((card) => card !== undefined);

  const { errors, warnings } = validateContent({
    packs: packsModule,
    cards,
    cardFiles: files.map(stripSlash),
    meta: metaModule,
    strings: { en, nl },
    artFiles: Object.keys(artModules).map(baseName),
  });

  if (errors.length > 0) {
    const error = new ContentError(errors);
    if (import.meta.env.DEV) throw error;
    console.error(error.message);
  } else if (import.meta.env.DEV && warnings.length > 0) {
    console.warn(`Content warnings:\n${formatIssues(warnings)}`);
  }

  return createBundle({ packs: packsModule, cards, meta: metaModule, strings: { en, nl } });
}

let cached: ContentBundle | undefined;

/** The content bundle, loaded and validated once. */
export function getBundle(): ContentBundle {
  cached ??= load();
  return cached;
}

/** The app's content. Importing this module validates /content (see top of file). */
export const bundle: ContentBundle = getBundle();
