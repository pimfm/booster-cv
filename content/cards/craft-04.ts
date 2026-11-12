import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'craft-04',
  kind: 'skill',
  rarity: 'common',
  title: { en: 'Reserved for craft', nl: 'Gereserveerd voor het vak' },
  flavour: {
    en: 'Nothing to see yet. The card is cut and sleeved; the text is at the printer.',
    nl: 'Nog niets te zien. De kaart is gesneden en gesleeved; de tekst ligt bij de drukker.',
  },
  body: {
    en: `The last card of the pack is kept simple on purpose. This one is simpler than intended.`,
    nl: `De laatste kaart van een pakje is met opzet eenvoudig. Deze is eenvoudiger dan de bedoeling was.`,
  },
  tags: [{ en: 'Reserved', nl: 'Gereserveerd' }],
  art: null,
});
