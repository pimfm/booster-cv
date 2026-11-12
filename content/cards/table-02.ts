import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'table-02',
  kind: 'table',
  rarity: 'uncommon',
  title: { en: 'A recommendation, pending', nl: 'Een aanrader, binnenkort' },
  flavour: {
    en: "A game he'd put in your hands, and why. He hasn't picked it yet.",
    nl: 'Een spel dat hij je in handen zou drukken, en waarom. Hij heeft nog niet gekozen.',
  },
  body: {
    en: `A good recommendation needs a game, a person and a reason. All three will be filled in here.`,
    nl: `Een goede aanrader heeft een spel, een persoon en een reden nodig. Alle drie worden hier nog ingevuld.`,
  },
  tags: [{ en: 'To be written', nl: 'Nog te schrijven' }],
  art: null,
});
