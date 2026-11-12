import { defineCard } from '../../src/content/define';

// PLACEHOLDER — Pim replaces every word on this card.
export default defineCard({
  id: 'craft-01',
  kind: 'skill',
  rarity: 'common',
  title: { en: 'Placeholder skill', nl: 'Voorlopige vaardigheid' },
  flavour: {
    en: 'Something Pim can actually do. Proof to follow in the text below.',
    nl: 'Iets wat Pim echt kan. Het bewijs volgt in de tekst hieronder.',
  },
  body: {
    en: `This is where the proof goes: what the skill looks like in practice, and one concrete example.

The example is missing because it has to be a real one.`,
    nl: `Hier komt het bewijs: hoe de vaardigheid er in de praktijk uitziet, met één concreet voorbeeld.

Het voorbeeld ontbreekt nog, omdat het een echt voorbeeld moet zijn.`,
  },
  stats: [
    { label: { en: 'Precision', nl: 'Precisie' }, value: 5 },
    { label: { en: 'Stamina', nl: 'Uithoudingsvermogen' }, value: 5 },
  ],
  tags: [{ en: 'Placeholder', nl: 'Plaatshouder' }],
  art: null,
});
