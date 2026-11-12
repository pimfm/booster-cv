// F-06 stand-in. Lane B (PK-01/02) replaces the body; keep the `data-slot` root and the test ids.
import { useEffect } from 'react';
import { cardsInPack } from '@/content/bundle';
import { focusedPack, isPackOpened, useExperience } from '@/machine';
import { useLocale } from '@/platform/i18n';
import stub from '@/app/stub.module.css';
import { useHold } from './useHold';

function FocusedPack() {
  const { state, dispatch, bundle } = useExperience();
  const { t, L } = useLocale();
  const hold = useHold<HTMLButtonElement>();
  const pack = focusedPack(state, bundle);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'UNFOCUS_PACK' });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  if (!pack) return null;

  return (
    <div data-slot="pack-shelf" data-mode="focused" className={stub.slot}>
      <button
        type="button"
        data-testid="back-to-box"
        className={stub.button}
        onClick={() => dispatch({ type: 'UNFOCUS_PACK' })}
      >
        {t('back_to_box')}
      </button>
      <button
        type="button"
        data-testid="focused-pack"
        data-pack-id={pack.id}
        data-holding={state.phase === 'pack-tearing'}
        className={`${stub.target} ${stub.hold}`}
        aria-label={`${L(pack.name)} — ${t('hold_pack')}`}
        {...hold}
      >
        <span className={stub.title}>{L(pack.name)}</span>
        <span className={stub.small}>
          {t('cards_count', { n: cardsInPack(bundle, pack.id).length })}
        </span>
      </button>
    </div>
  );
}

function Shelf() {
  const { state, dispatch, bundle } = useExperience();
  const { t, L } = useLocale();

  return (
    <div data-slot="pack-shelf" data-mode="shelf" className={stub.row}>
      {bundle.packs.map((pack) => {
        const opened = isPackOpened(state, pack.id);
        const count = cardsInPack(bundle, pack.id).length;
        return (
          <button
            key={pack.id}
            type="button"
            data-testid={`pack-${pack.id}`}
            data-pack-id={pack.id}
            data-count={count}
            data-opened={opened}
            className={stub.target}
            disabled={opened}
            onClick={() => dispatch({ type: 'FOCUS_PACK', packId: pack.id })}
          >
            <span className={stub.title}>{L(pack.name)}</span>
            <span className={stub.small}>
              {opened ? t('opened') : t('cards_count', { n: count })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PackShelf() {
  const { state } = useExperience();
  if (state.phase === 'box-open') return <Shelf />;
  if (state.phase === 'pack-focused' || state.phase === 'pack-tearing') return <FocusedPack />;
  return null;
}
