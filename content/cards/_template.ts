import { defineCard } from '../../src/content/define';

// Copy this file, rename it to <id>.ts, and add the id to a pack in ../packs.ts —
// or let `npm run content:new -- --id <id> --pack <pack>` do all three.
// Files starting with "_" are never loaded. "Placeholder" in a title or flavour is
// counted by content:stats and fails content:check --no-placeholders.
export default defineCard({
  id: 'my-card-id',
  kind: 'trait',
  rarity: 'common',
  title:   { en: 'Placeholder title', nl: 'Placeholder titel' },
  flavour: { en: 'Placeholder: one dry line that makes someone nod.', nl: 'Placeholder: één droge zin.' },
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
