import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'table-03',
  kind: 'table',
  rarity: 'holo',
  title: { en: 'The one to remember', nl: 'Die ene om te onthouden' },
  flavour: {
    en: 'The holo. Whatever Pim wants you to walk away with ends up on this card.',
    nl: 'De holo. Wat Pim je wil laten onthouden, komt op deze kaart.',
  },
  body: {
    en: `There is one holo in the box. It is for the single thing a visitor should still know a week later.

Pim decides what that is. For now the card only shows how the foil catches the light.`,
    nl: `Er zit één holo in de doos. Die is voor het ene ding dat een bezoeker een week later nog moet weten.

Pim bepaalt wat dat is. Voorlopig laat de kaart alleen zien hoe de folie het licht vangt.`,
  },
  stats: [
    { label: { en: 'Hosting', nl: 'Gastheerschap' }, value: 9 },
    { label: { en: 'Clarity', nl: 'Helderheid' }, value: 8 },
    { label: { en: 'Humour', nl: 'Humor' }, value: 7 },
  ],
  tags: [{ en: 'Reserved', nl: 'Gereserveerd' }],
  art: null,
});
