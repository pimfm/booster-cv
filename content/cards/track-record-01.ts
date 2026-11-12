import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'track-record-01',
  kind: 'experience',
  rarity: 'common',
  title: { en: 'Placeholder experience', nl: 'Voorlopige ervaring' },
  flavour: {
    en: 'A role, a place, a few years. Dates and details to be filled in by Pim.',
    nl: 'Een rol, een plek, een paar jaar. Data en details vult Pim zelf in.',
  },
  body: {
    en: `Experience cards are short: what the role was, and one thing that came out of it. This one has neither yet.`,
    nl: `Ervaringskaarten zijn kort: wat de rol was, en één ding dat het opleverde. Deze heeft nog geen van beide.`,
  },
  tags: [{ en: 'Placeholder', nl: 'Plaatshouder' }],
  art: null,
});
