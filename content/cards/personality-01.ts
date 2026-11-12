import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'personality-01',
  kind: 'trait',
  rarity: 'common',
  title: { en: 'Placeholder trait', nl: 'Voorlopige eigenschap' },
  flavour: {
    en: "A true thing about Pim goes here. He'll write it himself.",
    nl: 'Hier komt iets wat klopt over Pim. Dat schrijft hij zelf.',
  },
  body: {
    en: `This card is holding a seat. The real one says how Pim is with people, with one example that actually happened.

Until then: the frame is real, the words are not.`,
    nl: `Deze kaart houdt een plek bezet. De echte vertelt hoe Pim met mensen omgaat, met één voorbeeld dat echt gebeurd is.

Tot die tijd: het kader is echt, de woorden nog niet.`,
  },
  stats: [
    { label: { en: 'Patience', nl: 'Geduld' }, value: 5 },
    { label: { en: 'Clarity', nl: 'Helderheid' }, value: 5 },
  ],
  tags: [{ en: 'Placeholder', nl: 'Plaatshouder' }],
  art: null,
});
