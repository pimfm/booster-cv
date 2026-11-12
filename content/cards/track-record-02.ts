import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'track-record-02',
  kind: 'experience',
  rarity: 'uncommon',
  title: { en: 'Something built or run', nl: 'Iets gebouwd of gedraaid' },
  flavour: {
    en: "One sentence a non-developer would understand. It hasn't been written yet.",
    nl: 'Eén zin die ook een niet-programmeur snapt. Hij is nog niet geschreven.',
  },
  body: {
    en: `The real card describes something Pim built or organised, in words that work across a shop counter.`,
    nl: `De echte kaart beschrijft iets wat Pim bouwde of organiseerde, in woorden die ook over een toonbank werken.`,
  },
  stats: [
    { label: { en: 'Precision', nl: 'Precisie' }, value: 6 },
    { label: { en: 'Stamina', nl: 'Uithoudingsvermogen' }, value: 7 },
  ],
  art: null,
});
