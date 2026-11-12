/**
 * Public surface of the content layer.
 * Note: importing this module loads and validates /content (via loader.ts). Files in
 * /content import `./define` directly; pure code and tests can import `./bundle`,
 * `./rules` or `./types` to stay glob-free.
 */
export type * from './types';
export { CARD_KINDS, LOCALES, RARITIES } from './types';
export { defineCard, defineMeta, definePack, definePacks, defineStrings } from './define';
export { FILES, LIMITS, formatIssue, formatIssues, validateContent } from './rules';
export type { Issue, ValidateInput, ValidationResult } from './rules';
export {
  CONTACT_NUMBER,
  ContentError,
  bundle,
  cardNumber,
  cardsInPack,
  createBundle,
  getBundle,
  getCard,
  getPack,
  packOfCard,
  totalCards,
  totalWithContact,
} from './loader';
export type { BundleParts, CardNumber } from './loader';
