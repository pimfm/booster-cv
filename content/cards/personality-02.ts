import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'personality-02',
  kind: 'trait',
  rarity: 'uncommon',
  title: { en: 'Trait with a twist', nl: 'Eigenschap met een draai' },
  flavour: {
    en: 'Slightly less common than the last one. The details are still pending.',
    nl: 'Iets minder gewoon dan de vorige. De details volgen nog.',
  },
  body: {
    en: `Uncommon cards are for a trait with a twist. Which trait, and which twist, is for Pim to say.`,
    nl: `Ongewone kaarten zijn voor een eigenschap met een draai. Welke eigenschap, en welke draai, mag Pim zeggen.`,
  },
  tags: [{ en: 'To be written', nl: 'Nog te schrijven' }],
  art: null,
});
