// F-06 stand-in. Lane C (RV-03) replaces the body; keep the `data-slot` root and the test ids.
// Not in the stand-in: focus trap, focus return, closing by clicking the dimmed stage.
import { useEffect, useId } from 'react';
import { detailCard, useExperience } from '@/machine';
import { useLocale } from '@/platform/i18n';
import stub from '@/app/stub.module.css';

export function CardDetail() {
  const { state, dispatch, bundle } = useExperience();
  const { t, L } = useLocale();
  const titleId = useId();
  const open = state.phase === 'card-detail';
  const card = detailCard(state, bundle);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'CLOSE_DETAIL' });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, dispatch]);

  if (!open || !card) return null;

  return (
    <div data-slot="card-detail" className={stub.overlay}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="card-detail"
        data-card-id={card.id}
        className={stub.panel}
      >
        <h2 id={titleId} className={stub.title}>
          {L(card.title)}
        </h2>
        <p className={stub.small}>{t(`rarity_${card.rarity}`)}</p>
        <p className={stub.body} data-testid="card-body">
          {L(card.body)}
        </p>
        {card.links && card.links.length > 0 ? (
          <ul>
            {card.links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{L(link.label)}</a>
              </li>
            ))}
          </ul>
        ) : null}
        <div className={stub.row}>
          <button
            type="button"
            data-testid="close-detail"
            className={stub.button}
            onClick={() => dispatch({ type: 'CLOSE_DETAIL' })}
          >
            {t('close')}
          </button>
          {state.stageCardId === card.id ? (
            <button
              type="button"
              data-testid="detail-collect"
              className={stub.button}
              onClick={() => dispatch({ type: 'COLLECT_CARD' })}
            >
              {t('collect')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
