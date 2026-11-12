import type { ComponentPropsWithRef } from 'react';
import { cx } from './cx';
import styles from './Chip.module.css';

export type ChipProps = ComponentPropsWithRef<'span'>;

/** An outlined tag (skills, tools, places). */
export function Chip({ className, ...rest }: ChipProps) {
  return <span className={cx(styles.chip, className)} {...rest} />;
}
