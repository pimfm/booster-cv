import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'table-01',
  kind: 'table',
  rarity: 'common',
  title: { en: 'Placeholder at the table', nl: 'Voorlopig aan tafel' },
  flavour: {
    en: 'What Pim brings to a game night goes here, in his own words.',
    nl: 'Wat Pim meeneemt naar een spelavond komt hier, in zijn eigen woorden.',
  },
  body: {
    en: `Cards in this pack are about games: hosting them, explaining them, recommending them. This one is waiting for its first real sentence.`,
    nl: `De kaarten in dit pakje gaan over spellen: ze hosten, uitleggen en aanraden. Deze wacht nog op zijn eerste echte zin.`,
  },
  stats: [
    { label: { en: 'Hosting', nl: 'Gastheerschap' }, value: 5 },
    { label: { en: 'Patience', nl: 'Geduld' }, value: 5 },
  ],
  tags: [{ en: 'Placeholder', nl: 'Plaatshouder' }],
  art: null,
});
