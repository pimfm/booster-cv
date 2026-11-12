import '@/design/directions/fonts1';
import '@/design/directions/direction1.css';
import tokensCss from '@/design/directions/direction1.css?raw';
import { StyleTile, type DirectionSpec } from './StyleTile';

const spec: DirectionSpec = {
  id: 1,
  scope: 'direction-1',
  name: 'Print shop',
  mood: [
    'Warm paper, black ink and two spot colours, like a short run from a letterpress studio.',
    'Calm and editorial: the cards are the loud part, everything around them keeps its voice down.',
  ],
  tokensCss,
  display: { name: 'Archivo Black', note: 'Compact geometric grotesk, one weight. Uppercase for headings, sentence case on cards.' },
  text: { name: 'Inter Variable', note: 'Body, labels and numbers. 400 to 700, tabular figures for card numbers.' },
  varies: [
    { label: 'Paper', value: 'Warm cream' },
    { label: 'Accents', value: 'Cobalt and mustard' },
    { label: 'Display', value: 'Archivo Black, geometric' },
    { label: 'Stage', value: 'Dot grid' },
    { label: 'Rarity', value: 'Colour of the card frame' },
  ],
  rarityStyle: 'frame',
  stage: 'dots',
  stageNotes: [
    'The stage is a cutting mat: a 20 px dot grid at low contrast, nothing else.',
    'Rarity is the colour of the frame around a card, so a rare is recognisable at binder size.',
    'Mustard is the action colour, cobalt is reserved for focus and for rares.',
    'Radius 2 px on controls, 12 px on cards. Shadows are 4 px and 8 px, never larger.',
  ],
};

export default function Direction1() {
  return <StyleTile spec={spec} />;
}
