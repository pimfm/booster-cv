// F-06 stand-in. Lane C (RV-01) replaces the body; keep the `data-slot` root and the test id.
// Not in the stand-in: the stack-rise and its 400 ms input lock (sceneTiming.stackRiseMs).
import { useEffect } from 'react';
import { useExperience } from '@/machine';
import { useLocale } from '@/platform/i18n';
import stub from '@/app/stub.module.css';

export function RevealStack() {
  const { state, dispatch } = useExperience();
  const { t } = useLocale();
  const left = state.queue.length;
  const finale = state.phase === 'all-collected' && left > 0;

  // The contact card is not picked from a stack: it is drawn onto the stage by itself (§7).
  useEffect(() => {
    if (finale) dispatch({ type: 'DRAW_CARD' });
  }, [finale, dispatch]);

  if (state.phase !== 'revealing' && !finale) return null;

  return (
    <div data-slot="reveal-stack" className={stub.slot}>
      <button
        type="button"
        data-testid="reveal-stack"
        data-left={left}
        className={stub.target}
        aria-label={t('tap_to_draw')}
        onClick={() => dispatch({ type: 'DRAW_CARD' })}
      >
        <span className={stub.small} data-testid="cards-left">
          {t('cards_left', { n: left })}
        </span>
      </button>
    </div>
  );
}
