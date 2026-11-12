import { defineStrings } from '../src/content/define';
import type { Strings } from '../src/content/types';

/** UI chrome strings — Dutch. Same keys as strings.en.ts; a missing or extra key is a type error. */
export default defineStrings<Strings>({
  // doos
  hold_box: 'Houd vast om te openen',
  hold_not_yet: 'Nog niet — blijf vasthouden.',
  opening: 'Gaat open…',
  box_subtitle: 'Boosterbox · 1 van 1',
  box_counts: '{cards} kaarten · {packs} pakjes',

  // plank en pakjes
  pick_pack: 'Kies een pakje.',
  hold_pack: 'Houd vast om te scheuren',
  back_to_box: '← Doos',
  opened: 'Geopend',
  cards_count: { one: '{n} kaart', other: '{n} kaarten' },

  // onthullen
  tap_to_draw: 'Tik op de bovenste kaart',
  cards_left: { one: 'De laatste uit dit pakje.', other: 'Nog {n}' },
  last_in_pack: 'De laatste uit dit pakje.',
  card_revealed: '{title} — {rarity}',
  read_more: 'Lees',
  collect: 'Bewaar →',
  close: 'Sluiten',
  pack_done: 'Pakje leeg.',
  all_done: 'Dat was de doos. Bedankt voor het openmaken.',

  // reset
  reset: 'Doos resetten',
  reset_confirm: 'Folie er weer omheen? Je verzamelmap raakt leeg.',
  reset_yes: 'Ja',
  reset_no: 'Nee',

  // verzamelmap
  binder: 'Verzamelmap',
  binder_open: 'Verzamelmap openen',
  binder_close: 'Verzamelmap sluiten',
  binder_complete: 'Verzamelmap compleet',
  binder_progress: '{collected} / {total}',
  slot_empty: 'Vakje {n}, leeg',
  slot_filled: '{title}, {rarity}, verzameld',
  skip_to_binder: 'Ga naar de verzamelmap',

  // kop
  sound_on: 'Geluid aan',
  sound_off: 'Geluid uit',
  language: 'Taal',
  lang_en: 'English',
  lang_nl: 'Nederlands',

  // kaart
  rarity_common: 'Gewoon',
  rarity_uncommon: 'Ongewoon',
  rarity_rare: 'Zeldzaam',
  rarity_holo: 'Holo',
  kind_trait: 'Eigenschap',
  kind_skill: 'Vaardigheid',
  kind_experience: 'Ervaring',
  kind_table: 'Aan tafel',
  kind_contact: 'Contact',
  art_placeholder: 'ART',
  card_number: '{n} / {total}',

  // sneltoetsen
  shortcuts: 'Sneltoetsen',
  shortcut_hold: 'Vasthouden om de doos te openen of een pakje open te scheuren',
  shortcut_move: 'Van pakje naar pakje',
  shortcut_draw: 'Bovenste kaart trekken',
  shortcut_collect: 'Kaart bewaren',
  shortcut_read: 'Kaart lezen',
  shortcut_back: 'Terug, sluiten of annuleren',
  shortcut_binder: 'Naar de verzamelmap',
  shortcut_sound: 'Geluid aan of uit',
  shortcut_language: 'Van taal wisselen',
});
