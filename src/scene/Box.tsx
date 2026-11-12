// F-06 stand-in. Lane A (BX-01) replaces the body; keep the `data-slot` root and the test id.
import { totalCards } from '@/content/bundle';
import { useExperience } from '@/machine';
import { useLocale } from '@/platform/i18n';
import stub from '@/app/stub.module.css';
import { useHold } from './useHold';

export function Box() {
  const { state, bundle } = useExperience();
  const { t, L } = useLocale();
  const hold = useHold<HTMLButtonElement>();

  if (state.phase !== 'sealed' && state.phase !== 'unwrapping') return null;

  return (
    <div data-slot="box" className={stub.slot}>
      <button
        type="button"
        data-testid="box"
        data-holding={state.phase === 'unwrapping'}
        className={`${stub.target} ${stub.hold}`}
        aria-label={t('hold_box')}
        {...hold}
      >
        <span className={stub.title}>{L(bundle.meta.setName)}</span>
        <span className={stub.small}>{t('box_subtitle')}</span>
        <span className={stub.small} data-testid="box-counts">
          {t('box_counts', { cards: totalCards(bundle), packs: bundle.packs.length })}
        </span>
      </button>
    </div>
  );
}
