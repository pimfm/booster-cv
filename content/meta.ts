import { defineMeta } from '../src/content/define';

/** Name, tagline, contact, OG text. Everything here is placeholder until Pim fills it in. */
export default defineMeta({
  name: 'Pim',
  setName: { en: 'Pim — Booster Box', nl: 'Pim — Boosterbox' },
  tagline: {
    en: 'A CV you open like a booster box. Tagline pending.',
    nl: 'Een cv dat je openmaakt als een boosterbox. Slogan volgt.',
  },
  contact: {
    email: 'you@example.com',
    links: [{ label: { en: 'LinkedIn', nl: 'LinkedIn' }, href: 'https://example.com/pim' }],
  },
  contactCard: {
    id: 'contact',
    kind: 'contact',
    rarity: 'holo',
    title: { en: 'Get in touch', nl: 'Neem contact op' },
    flavour: {
      en: 'The last card in the box. Real contact details will replace this line.',
      nl: 'De laatste kaart uit de doos. Hier komen de echte contactgegevens.',
    },
    body: {
      en: `That was every card. If the box made you curious, this is where Pim tells you how to reach him.

The address below is a placeholder; he will swap it for a real one.`,
      nl: `Dat waren alle kaarten. Ben je nieuwsgierig geworden, dan staat hier straks hoe je Pim bereikt.

Het adres hieronder is een plaatshouder; hij vervangt het door een echt adres.`,
    },
    art: null,
    links: [{ label: { en: 'Email', nl: 'E-mail' }, href: 'mailto:you@example.com' }],
  },
  og: {
    title: { en: 'Pim — Booster Box', nl: 'Pim — Boosterbox' },
    description: {
      en: 'A CV in a sealed booster box. Open it, tear the packs, collect the cards.',
      nl: 'Een cv in een verzegelde boosterbox. Maak hem open, scheur de pakjes, verzamel de kaarten.',
    },
  },
  contentVersion: 1,
});
