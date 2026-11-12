import type { ComponentPropsWithRef } from 'react';
import { cx } from './cx';
import styles from './Kbd.module.css';

export type KbdProps = ComponentPropsWithRef<'kbd'>;

/** A keyboard hint: one key in a small pressed-paper box. */
export function Kbd({ className, ...rest }: KbdProps) {
  return <kbd className={cx(styles.kbd, className)} {...rest} />;
}
