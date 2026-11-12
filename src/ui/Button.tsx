import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from './cx';
import { Kbd } from './Kbd';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  /** `primary` = the one action colour; `secondary` = paper; `ghost` = text-like. Default `primary`. */
  variant?: ButtonVariant;
  /** `md` ≥ 44 px; `sm` 36 px on fine pointers (still 44 px on touch). Default `md`. */
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Keyboard hint (e.g. "Space"), shown only on hover-capable fine pointers. Decorative. */
  kbd?: ReactNode;
};

/**
 * The kit's button. Presses like a stamp: the hard shadow collapses and the button moves
 * into its place (`:active` or `data-pressed`). `data-state="hover|active|focus"` freezes a look.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  kbd,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], size === 'sm' && styles.sm, className)}
      {...rest}
    >
      {leadingIcon != null && <span className={styles.icon}>{leadingIcon}</span>}
      <span className={styles.label}>{children}</span>
      {trailingIcon != null && <span className={styles.icon}>{trailingIcon}</span>}
      {kbd != null && (
        <span className={styles.kbd} aria-hidden="true">
          <Kbd>{kbd}</Kbd>
        </span>
      )}
    </button>
  );
}
