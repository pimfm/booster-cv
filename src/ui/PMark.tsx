import type { ComponentPropsWithRef } from 'react';
import { cx } from './cx';
import styles from './PMark.module.css';

export type PMarkProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
  /** The initial in the square. */
  letter?: string;
};

/** Pim's mark: an initial in a mustard square. Header, card back, box, packs. Decorative. */
export function PMark({ letter = 'P', className, ...rest }: PMarkProps) {
  return (
    <span className={cx(styles.pmark, className)} aria-hidden="true" {...rest}>
      {letter}
    </span>
  );
}
