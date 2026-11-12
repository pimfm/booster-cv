// F-06 stand-in. SC-01 replaces the body; keep the `data-slot="stage"` root (layoutIds.ts).
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { StringKey } from '@/content/types';
import { useExperience } from '@/machine';
import type { Phase } from '@/machine';
import { useLocale } from '@/platform/i18n';
import { sceneTiming } from './timing';

/** The one line of copy under the stage, per phase. */
const HINTS: Partial<Record<Phase, StringKey>> = {
  sealed: 'hold_box',
  unwrapping: 'hold_box',
  'box-open': 'pick_pack',
  'pack-focused': 'hold_pack',
  'pack-tearing': 'hold_pack',
  revealing: 'tap_to_draw',
  'all-collected': 'all_done',
};

/** "Not yet" replaces the hint for a moment after an early release (INTERACTION-SPEC §1). */
function useNotYet(): boolean {
  const { state } = useExperience();
  const cancelled = state.lastHoldCancelledAt;
  // the cancel count whose message has run its time
  const [expired, setExpired] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setExpired(cancelled),
      cancelled === null ? 0 : sceneTiming.notYetMs,
    );
    return () => window.clearTimeout(timer);
  }, [cancelled]);

  const resting = state.phase === 'sealed' || state.phase === 'pack-focused';
  return resting && cancelled !== null && cancelled !== expired;
}

export function Stage({ children }: { children?: ReactNode }) {
  const { state } = useExperience();
  const { t } = useLocale();
  const notYet = useNotYet();
  const key: StringKey | undefined = notYet ? 'hold_not_yet' : HINTS[state.phase];

  return (
    <div data-slot="stage">
      {children}
      <p data-testid="stage-copy" data-copy={key ?? ''}>
        {key ? t(key) : ''}
      </p>
    </div>
  );
}
