// F-06 stand-in for the "Pack done." beat (INTERACTION-SPEC §6). Lane C replaces the body.
import { useEffect } from 'react';
import { useExperience } from '@/machine';
import { useLocale } from '@/platform/i18n';
import stub from '@/app/stub.module.css';
import { sceneTiming } from './timing';

export function PackComplete() {
  const { state, dispatch } = useExperience();
  const { t } = useLocale();
  const active = state.phase === 'pack-complete';

  // The one timed transition: it ends by itself, or on any press or key, whichever is first.
  useEffect(() => {
    if (!active) return;
    const dismiss = () => dispatch({ type: 'DISMISS_PACK' });
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.repeat) dismiss(); // a key still held from "Collect" must not skip the beat
    };
    const timer = window.setTimeout(dismiss, sceneTiming.packDoneMs);
    window.addEventListener('pointerdown', dismiss);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [active, dispatch]);

  if (!active) return null;

  return (
    <div data-slot="pack-complete" className={stub.slot}>
      <p data-testid="pack-done" className={stub.title}>
        {t('pack_done')}
      </p>
    </div>
  );
}
