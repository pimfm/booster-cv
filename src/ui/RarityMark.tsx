import { useId } from 'react';
import type { Rarity } from '@/design/tokens';
import { cx } from './cx';
import styles from './RarityMark.module.css';

export interface RarityMarkProps {
  rarity: Rarity;
  className?: string | undefined;
}

const DIAMOND = '8,1.6 14.4,8 8,14.4 1.6,8';

/** Common: one square · uncommon: two · rare: outlined diamond · holo: diamond with a sharp band. Decorative. */
export function RarityMark({ rarity, className }: RarityMarkProps) {
  const clip = useId();
  const cls = cx(styles.mark, className);
  if (rarity === 'common') {
    return (
      <svg className={cls} data-rarity={rarity} viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
        <rect width="10" height="10" fill="currentColor" />
      </svg>
    );
  }
  if (rarity === 'uncommon') {
    return (
      <svg className={cls} data-rarity={rarity} viewBox="0 0 23 10" width="23" height="10" aria-hidden="true">
        <rect width="10" height="10" fill="currentColor" />
        <rect x="13" width="10" height="10" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      className={cx(cls, styles.diamond)}
      data-rarity={rarity}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
    >
      {rarity === 'holo' && (
        <>
          <clipPath id={clip}>
            <polygon points={DIAMOND} />
          </clipPath>
          <polygon points="4.2,16 8.2,16 12.2,0 8.2,0" fill="currentColor" clipPath={`url(#${clip})`} />
        </>
      )}
      <polygon points={DIAMOND} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
    </svg>
  );
}
