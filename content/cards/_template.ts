import { defineCard } from '../../src/content/define';

// Copy this file, rename it to <id>.ts, and add the id to a pack in ../packs.ts.
// Files starting with "_" are never loaded.
export default defineCard({
  id: 'my-card-id',
  kind: 'trait',
  rarity: 'common',
  title:   { en: 'Title',  nl: 'Titel' },
  flavour: { en: 'One dry line that makes someone nod.', nl: 'Eén droge zin.' },
  body: {
    en: `A paragraph or two. What this looks like in practice, with one concrete example.`,
    nl: `Een alinea of twee. Hoe dit er in de praktijk uitziet, met één concreet voorbeeld.`,
  },
  stats: [
    { label: { en: 'Patience', nl: 'Geduld' }, value: 9 },
  ],
  tags: [{ en: 'Teaching', nl: 'Uitleggen' }],
  art: null,          // drop content/art/my-card-id.webp and set to 'my-card-id.webp'
});
