import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'personality-03',
  kind: 'trait',
  rarity: 'rare',
  title: { en: 'The rare one', nl: 'De zeldzame' },
  flavour: {
    en: 'One of the few things that make Pim Pim. Reserved, not yet written.',
    nl: 'Een van de weinige dingen die Pim tot Pim maken. Gereserveerd, nog niet geschreven.',
  },
  body: {
    en: `A pack gets one rare at most, and it sits in slot three. This is that slot.

The card that belongs here should make someone who knows Pim nod. It will be written by him, not guessed at by a template.`,
    nl: `Een pakje krijgt hooguit één zeldzame kaart, en die ligt op plek drie. Dit is die plek.

De kaart die hier hoort, moet iemand die Pim kent laten knikken. Hij schrijft hem zelf; een sjabloon gaat er niet naar raden.`,
  },
  stats: [
    { label: { en: 'Patience', nl: 'Geduld' }, value: 7 },
    { label: { en: 'Humour', nl: 'Humor' }, value: 6 },
    { label: { en: 'Clarity', nl: 'Helderheid' }, value: 8 },
  ],
  tags: [{ en: 'Reserved', nl: 'Gereserveerd' }],
  art: null,
});
