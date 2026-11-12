import type { ComponentPropsWithRef } from 'react';
import type { Rarity } from '@/design/tokens';
import { cx } from './cx';
import { RarityMark } from './RarityMark';
import styles from './Badge.module.css';

export type BadgeProps = ComponentPropsWithRef<'span'> & {
  /** Adds the rarity mark on a `--rarity-*` fill before the text. */
  rarity?: Rarity;
};

/** A text badge; with `rarity`, the rarity badge used on cards and in the binder. */
export function Badge({ rarity, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx(styles.badge, className)} data-rarity={rarity} {...rest}>
      {rarity !== undefined && (
        <span className={styles.mark}>
          <RarityMark rarity={rarity} />
        </span>
      )}
      <span className={styles.label}>{children}</span>
    </span>
  );
}
