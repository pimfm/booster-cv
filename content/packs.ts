import { definePacks } from '../src/content/define';

/**
 * The packs (chapters), in shelf order, and the REVEAL ORDER of the cards inside each.
 * Open with an easy one, put the rare in slot 3, end on a calm card.
 */
export default definePacks([
  {
    id: 'personality',
    name: { en: 'Personality', nl: 'Karakter' },
    blurb: { en: 'How he is with people.', nl: 'Hoe hij met mensen omgaat.' },
    tint: 1,
    cards: ['personality-01', 'personality-02', 'personality-03', 'personality-04'],
  },
  {
    id: 'craft',
    name: { en: 'Craft', nl: 'Vak' },
    blurb: { en: 'What he can actually do.', nl: 'Wat hij echt kan.' },
    tint: 2,
    cards: ['craft-01', 'craft-02', 'craft-03', 'craft-04'],
  },
  {
    id: 'table',
    name: { en: 'At the table', nl: 'Aan tafel' },
    blurb: { en: 'Games, hosting, explaining the rules.', nl: 'Spellen, gastheer zijn, regels uitleggen.' },
    tint: 3,
    cards: ['table-01', 'table-02', 'table-03', 'table-04'],
  },
  {
    id: 'track-record',
    name: { en: 'Track record', nl: 'Staat van dienst' },
    blurb: { en: 'Where he has been, what he built.', nl: 'Waar hij was, wat hij bouwde.' },
    tint: 4,
    cards: ['track-record-01', 'track-record-02', 'track-record-03', 'track-record-04'],
  },
]);
