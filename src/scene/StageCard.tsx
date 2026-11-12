// F-06 stand-in. Lane C (RV-02) replaces the body; keep the `data-slot` root and the test ids.
import { stageCard, useExperience } from '@/machine';
import { useLocale } from '@/platform/i18n';
import stub from '@/app/stub.module.css';

export function StageCard() {
  const { state, dispatch, bundle } = useExperience();
  const { t, L } = useLocale();
  const card = stageCard(state, bundle);

  if (state.phase !== 'card-on-stage' || !card) return null;

  return (
    <div data-slot="stage-card" className={stub.slot}>
      <article
        data-testid="stage-card"
        data-card-id={card.id}
        data-rarity={card.rarity}
        className={stub.card}
      >
        <h2 className={stub.title}>{L(card.title)}</h2>
        <p className={stub.small}>{t(`rarity_${card.rarity}`)}</p>
        <p className={stub.flavour}>{L(card.flavour)}</p>
      </article>
      <div className={stub.row}>
        <button
          type="button"
          data-testid="read"
          className={stub.button}
          onClick={() => dispatch({ type: 'OPEN_DETAIL' })}
        >
          {t('read_more')}
        </button>
        <button
          type="button"
          data-testid="collect"
          className={stub.button}
          onClick={() => dispatch({ type: 'COLLECT_CARD' })}
        >
          {t('collect')}
        </button>
      </div>
    </div>
  );
}
