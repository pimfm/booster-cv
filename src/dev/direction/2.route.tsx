import '@/design/directions/fonts2';
import '@/design/directions/direction2.css';
import tokensCss from '@/design/directions/direction2.css?raw';
import { StyleTile, type DirectionSpec } from './StyleTile';

const spec: DirectionSpec = {
  id: 2,
  scope: 'direction-2',
  name: 'Score pad',
  mood: [
    'Cool white paper ruled in deep blue ink, with tomato and mint as the two pens on the table.',
    'Brisker and more outspoken than the print shop: bigger type, square corners, one heavy shadow.',
  ],
  tokensCss,
  display: { name: 'Bricolage Grotesque', note: 'Expressive grotesk at weight 800. Sentence case, tight tracking, set large.' },
  text: { name: 'IBM Plex Sans', note: 'Body, labels and numbers. An engineer’s typeface, which suits the applicant.' },
  varies: [
    { label: 'Paper', value: 'Cool off-white' },
    { label: 'Accents', value: 'Tomato and mint' },
    { label: 'Display', value: 'Bricolage Grotesque, expressive' },
    { label: 'Stage', value: 'Plain, one oversized shadow' },
    { label: 'Rarity', value: 'Ink border and a corner stamp' },
  ],
  rarityStyle: 'stamp',
  stage: 'slab',
  stageNotes: [
    'The stage is plain paper. The tray under the packs carries the only oversized shadow, 16 px.',
    'Every card keeps the same ink border; rarity is a stamp on the top right corner.',
    'Ink is a deep blue instead of black, so borders and type read as written, not printed.',
    'Radius 0 on controls, 10 px on cards. Tomato is the action colour, mint marks on and done.',
  ],
};

export default function Direction2() {
  return <StyleTile spec={spec} />;
}
