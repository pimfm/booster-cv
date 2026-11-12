import { defineStrings } from '../src/content/define';

/**
 * UI chrome strings — English. The keys of this object ARE the `Strings` type;
 * strings.nl.ts must have exactly the same keys. Add keys, never rename them.
 * Placeholders: {n}, {title}, … Plurals: { one, other }.
 */
export default defineStrings({
  // box
  hold_box: 'Hold to open',
  hold_not_yet: 'Not yet — keep holding.',
  opening: 'Opening…',
  box_subtitle: 'Booster box · 1 of 1',
  box_counts: '{cards} cards · {packs} packs',

  // shelf and packs
  pick_pack: 'Pick a pack.',
  hold_pack: 'Hold to tear',
  back_to_box: '← Box',
  opened: 'Opened',
  cards_count: { one: '{n} card', other: '{n} cards' },

  // revealing
  tap_to_draw: 'Tap the top card',
  cards_left: { one: 'Last one in this pack.', other: '{n} left' },
  last_in_pack: 'Last one in this pack.',
  card_revealed: '{title} — {rarity}',
  read_more: 'Read',
  collect: 'Collect →',
  close: 'Close',
  pack_done: 'Pack done.',
  all_done: "That's the box. Thanks for opening it.",

  // reset
  reset: 'Reset box',
  reset_confirm: 'Put the wrap back on? Your binder empties.',
  reset_yes: 'Yes',
  reset_no: 'No',

  // binder
  binder: 'Binder',
  binder_open: 'Open binder',
  binder_close: 'Close binder',
  binder_complete: 'Binder complete',
  binder_progress: '{collected} / {total}',
  slot_empty: 'Slot {n}, empty',
  slot_filled: '{title}, {rarity}, collected',
  skip_to_binder: 'Skip to binder',

  // header
  sound_on: 'Sound on',
  sound_off: 'Sound off',
  language: 'Language',
  lang_en: 'English',
  lang_nl: 'Nederlands',

  // card face
  rarity_common: 'Common',
  rarity_uncommon: 'Uncommon',
  rarity_rare: 'Rare',
  rarity_holo: 'Holo',
  kind_trait: 'Trait',
  kind_skill: 'Skill',
  kind_experience: 'Experience',
  kind_table: 'Table',
  kind_contact: 'Contact',
  art_placeholder: 'ART',
  card_number: '{n} / {total}',

  // shortcuts popover
  shortcuts: 'Keyboard shortcuts',
  shortcut_hold: 'Hold to open the box or tear a pack',
  shortcut_move: 'Move between packs',
  shortcut_draw: 'Draw the top card',
  shortcut_collect: 'Collect the card',
  shortcut_read: 'Read the card',
  shortcut_back: 'Back, close or cancel',
  shortcut_binder: 'Go to the binder',
  shortcut_sound: 'Sound on or off',
  shortcut_language: 'Switch language',
});
