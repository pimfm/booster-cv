import { useEffect, useRef } from 'react';
import { useExperience } from '@/machine';
import type { ExperienceState } from '@/machine';
import { useLocale } from '@/platform/i18n';
import { announcementFor } from './announcements';
import { useAnnouncement, useAnnouncer } from './announcer';
import styles from './LiveRegion.module.css';

/** The one polite live region. Visually hidden; says whatever was last announced. */
export function LiveRegion() {
  const message = useAnnouncement();
  return (
    <div
      data-slot="live-region"
      data-testid="live-region"
      className={styles.visuallyHidden}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message?.text ?? ''}
    </div>
  );
}

/** Renders nothing: announces machine transitions (see announcements.ts). */
export function Announcements() {
  const { state, bundle } = useExperience();
  const { t, L } = useLocale();
  const { announce } = useAnnouncer();
  const previous = useRef<ExperienceState | null>(null);

  useEffect(() => {
    const prev = previous.current;
    if (prev === state) return; // locale change or a strict-mode re-run: nothing happened
    previous.current = state;
    const text = announcementFor(prev, state, bundle, { t, L });
    if (text !== null) announce(text);
  }, [state, bundle, t, L, announce]);

  return null;
}
