import type { ReactNode } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { AnnouncerProvider } from '@/chrome/announcer';
import { getBundle } from '@/content/loader';
import { ExperienceProvider } from '@/machine';
import { AudioProvider } from '@/platform/audio/AudioProvider';
import { LocaleProvider } from '@/platform/i18n';
import { PersistenceProvider } from '@/platform/persistence/PersistenceProvider';
import { AnimationActivityProvider } from './animationActivity';

/**
 * Everything the experience needs, in dependency order. Each provider lives in its own
 * file, so PL-02 (persistence) and PL-03 (audio) fill theirs in without editing this one.
 * `LazyMotion strict`: use `m.*` components, never `motion.*`.
 */
export function Providers({ children }: { children: ReactNode }) {
  const bundle = getBundle();
  return (
    <LazyMotion features={domAnimation} strict>
      <LocaleProvider strings={bundle.strings}>
        <ExperienceProvider bundle={bundle}>
          <PersistenceProvider>
            <AudioProvider>
              <AnnouncerProvider>
                <AnimationActivityProvider>{children}</AnimationActivityProvider>
              </AnnouncerProvider>
            </AudioProvider>
          </PersistenceProvider>
        </ExperienceProvider>
      </LocaleProvider>
    </LazyMotion>
  );
}
