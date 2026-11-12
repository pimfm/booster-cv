// F-06 stand-in. Lane D (BN-01/02) replaces the body; keep the `data-slot` root and the test ids.
import { cardNumber, cardsInPack } from '@/content/bundle';
import type { Card } from '@/content/types';
import { collectedCount, totalCount, useExperience } from '@/machine';
import { useLocale } from '@/platform/i18n';
import styles from './Binder.module.css';

export function Binder() {
  const { state, dispatch, bundle } = useExperience();
  const { t, L } = useLocale();
  const collected = collectedCount(state);
  const total = totalCount(bundle);
  // every slot from the start: pack order, then order in the pack, then the contact card
  const cards: Card[] = [
    ...bundle.packs.flatMap((pack) => cardsInPack(bundle, pack.id)),
    bundle.meta.contactCard,
  ];

  return (
    <nav data-slot="binder" data-testid="binder" aria-label={t('binder')}>
      <p
        data-testid="binder-count"
        data-collected={collected}
        data-total={total}
        className={styles.count}
      >
        {t('binder_progress', { collected, total })}
      </p>
      <ol className={styles.list}>
        {cards.map((card) => {
          const filled = state.collected.includes(card.id);
          const number = cardNumber(bundle, card.id) ?? '';
          return (
            <li key={card.id}>
              {filled ? (
                <button
                  type="button"
                  data-testid={`slot-${card.id}`}
                  data-filled="true"
                  className={styles.slot}
                  aria-label={t('slot_filled', {
                    title: L(card.title),
                    rarity: t(`rarity_${card.rarity}`),
                  })}
                  onClick={() => dispatch({ type: 'OPEN_DETAIL', cardId: card.id })}
                >
                  {number}
                </button>
              ) : (
                <span
                  data-testid={`slot-${card.id}`}
                  data-filled="false"
                  className={styles.slot}
                  role="img"
                  aria-label={t('slot_empty', { n: number })}
                >
                  {number}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
