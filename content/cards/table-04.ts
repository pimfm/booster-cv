import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'table-04',
  kind: 'table',
  rarity: 'common',
  title: { en: 'Seat saved', nl: 'Stoel bezet gehouden' },
  flavour: {
    en: 'A plain card keeping a chair warm until the real one sits down.',
    nl: 'Een gewone kaart die een stoel warm houdt tot de echte aanschuift.',
  },
  body: {
    en: `Every table has one empty chair for whoever arrives late. This card is that chair.`,
    nl: `Aan elke tafel staat één lege stoel voor wie te laat komt. Deze kaart is die stoel.`,
  },
  art: null,
});
