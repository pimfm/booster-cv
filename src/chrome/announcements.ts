/** Machine transition → live-region message. Pure; `<Announcements/>` runs it in an effect. */
import { getCard } from '@/content/bundle';
import type { ContentBundle, Localized, StringKey } from '@/content/types';
import type { ExperienceState } from '@/machine';
import type { Vars } from '@/platform/i18n';

export interface AnnouncementI18n {
  t: (key: StringKey, vars?: Vars) => string;
  L: (text: Localized) => string;
}

/**
 * What to say after `prev → next` (`prev` is null for the first render), or null for nothing.
 * An early release wins over the phase it falls back to.
 */
export function announcementFor(
  prev: ExperienceState | null,
  next: ExperienceState,
  bundle: ContentBundle,
  { t, L }: AnnouncementI18n,
): string | null {
  if (
    prev !== null &&
    next.lastHoldCancelledAt !== null &&
    next.lastHoldCancelledAt !== prev.lastHoldCancelledAt
  ) {
    return t('hold_not_yet');
  }
  if (prev !== null && prev.phase === next.phase) return null;

  switch (next.phase) {
    case 'sealed':
      return t('hold_box');
    case 'unwrapping':
    case 'pack-tearing':
      return t('opening');
    case 'box-open':
      return t('pick_pack');
    case 'pack-focused':
      return t('hold_pack');
    case 'revealing':
      return t('tap_to_draw');
    case 'card-on-stage': {
      if (prev?.phase === 'card-detail') return null; // back from Read: same card, already announced
      const card = next.stageCardId === null ? undefined : getCard(bundle, next.stageCardId);
      if (!card) return null;
      return t('card_revealed', { title: L(card.title), rarity: t(`rarity_${card.rarity}`) });
    }
    case 'pack-complete':
      return t('pack_done');
    case 'all-collected':
      // with the contact card still queued, the card itself is announced when it is drawn
      return next.queue.length === 0 ? t('all_done') : null;
    case 'card-detail':
    case 'resetting':
      return null;
  }
}
