import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'track-record-03',
  kind: 'experience',
  rarity: 'rare',
  title: { en: 'The highlight, withheld', nl: 'Het hoogtepunt, nog geheim' },
  flavour: {
    en: 'The line of the CV that matters most. Currently a blank with good posture.',
    nl: 'De regel van het cv die het meest telt. Voorlopig een lege plek met een rechte rug.',
  },
  body: {
    en: `Most CVs have one line that does the heavy lifting. It gets the rare slot in this pack.

Which line that is, Pim knows. The card will too, once he has written it.`,
    nl: `De meeste cv's hebben één regel die het zware werk doet. Die krijgt de zeldzame plek in dit pakje.

Welke regel dat is, weet Pim. De kaart weet het ook zodra hij hem geschreven heeft.`,
  },
  tags: [{ en: 'Reserved', nl: 'Gereserveerd' }],
  art: null,
});
