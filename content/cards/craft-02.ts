import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'craft-02',
  kind: 'skill',
  rarity: 'common',
  title: { en: 'Skill, to be named', nl: 'Vaardigheid, naam volgt' },
  flavour: {
    en: "The slot is real. The skill is too; it just hasn't been typed in yet.",
    nl: 'Het vakje bestaat echt. De vaardigheid ook; ze is alleen nog niet ingetikt.',
  },
  body: {
    en: `A second skill card, so the pack has a shape. Title, flavour line and this paragraph are all waiting for Pim.`,
    nl: `Een tweede vaardigheidskaart, zodat het pakje vorm heeft. Titel, ondertitel en deze alinea wachten allemaal op Pim.`,
  },
  art: null,
});
