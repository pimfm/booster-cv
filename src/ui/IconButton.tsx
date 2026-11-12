import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from './cx';
import styles from './IconButton.module.css';

export type IconButtonProps = Omit<
  ComponentPropsWithRef<'button'>,
  'aria-label' | 'aria-pressed' | 'children'
> & {
  /** Accessible name (required: an icon has no text). Becomes `aria-label`. */
  label: string;
  /** The icon (decorative; use `iconProps` from `@/ui`). */
  children: ReactNode;
  /** Set for toggle buttons; maps to `aria-pressed`. Omit for plain actions. */
  pressed?: boolean;
};

/** A square 44 px icon button. `data-state="hover|active|focus"` freezes a look. */
export function IconButton({
  label,
  pressed,
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.iconButton, className)}
      aria-label={label}
      {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
      {...rest}
    >
      {children}
    </button>
  );
}
