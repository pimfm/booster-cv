import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'craft-03',
  kind: 'skill',
  rarity: 'uncommon',
  title: { en: 'Unusually strong, allegedly', nl: 'Sterk, naar verluidt' },
  flavour: {
    en: "An uncommon card for a skill that stands out. Which one is Pim's call.",
    nl: 'Een ongewone kaart voor een vaardigheid die eruit springt. Welke, bepaalt Pim.',
  },
  body: {
    en: `The numbers below are stand-ins. They show how stat bars look on a card; they do not measure anything yet.`,
    nl: `De cijfers hieronder zijn invullers. Ze laten zien hoe de balkjes op een kaart staan; ze meten nog niets.`,
  },
  stats: [
    { label: { en: 'Precision', nl: 'Precisie' }, value: 8 },
    { label: { en: 'Clarity', nl: 'Helderheid' }, value: 7 },
    { label: { en: 'Stamina', nl: 'Uithoudingsvermogen' }, value: 6 },
  ],
  tags: [{ en: 'To be written', nl: 'Nog te schrijven' }],
  art: null,
});
