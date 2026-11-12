import { useId, type ComponentPropsWithRef, type MouseEvent } from 'react';
import { cx } from './cx';
import styles from './Toggle.module.css';

export type ToggleProps = Omit<
  ComponentPropsWithRef<'button'>,
  'role' | 'aria-checked' | 'children' | 'onChange'
> & {
  /** Controlled: the switch shows this; it never keeps its own state. */
  checked: boolean;
  /** Called with the next value on click / Space / Enter. */
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label, also the switch's accessible name. */
  label: string;
};

/** A labelled switch with a square thumb (sound on/off). `ref` goes to the switch button. */
export function Toggle({
  checked,
  onCheckedChange,
  label,
  className,
  onClick,
  id,
  type = 'button',
  ...rest
}: ToggleProps) {
  const autoId = useId();
  const switchId = id ?? autoId;
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) onCheckedChange?.(!checked);
  };
  return (
    <span className={cx(styles.row, className)}>
      <button
        type={type}
        role="switch"
        id={switchId}
        aria-checked={checked}
        className={styles.toggle}
        onClick={handleClick}
        {...rest}
      >
        <span className={styles.thumb} />
      </button>
      <label htmlFor={switchId} className={styles.label}>
        {label}
      </label>
    </span>
  );
}
