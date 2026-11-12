import { useRef } from 'react';
import { Binder } from '@/binder/Binder';
import { Header } from '@/chrome/Header';
import { Announcements, LiveRegion } from '@/chrome/LiveRegion';
import { useExperience } from '@/machine';
import { Box } from '@/scene/Box';
import { CardDetail } from '@/scene/CardDetail';
import { PackComplete } from '@/scene/PackComplete';
import { PackShelf } from '@/scene/PackShelf';
import { RevealStack } from '@/scene/RevealStack';
import { Stage } from '@/scene/Stage';
import { StageCard } from '@/scene/StageCard';
import { useAnimatingAttribute } from './animationActivity';
import { Providers } from './Providers';
import styles from './layout.module.css';

/**
 * The composition of AGENT-WORKFLOW §4. Each slot is its own file with a `data-slot` root
 * and returns null when its phase does not apply; lanes replace slot bodies, not this file.
 */
function Shell() {
  const { state } = useExperience();
  const mainRef = useRef<HTMLElement>(null);
  // `data-animating` is written by this hook, not by React: animations must not re-render
  useAnimatingAttribute(mainRef, state.holdDirection !== 'idle');

  return (
    <div className={styles.shell} data-slot="shell">
      <Header />
      <main ref={mainRef} className={styles.main} data-phase={state.phase} data-animating="false">
        <Stage>
          <Box />
          <PackShelf />
          <RevealStack />
          <StageCard />
          <PackComplete />
          <CardDetail />
        </Stage>
      </main>
      <Binder />
      <LiveRegion />
      <Announcements />
    </div>
  );
}

export function Experience() {
  return (
    <Providers>
      <Shell />
    </Providers>
  );
}
