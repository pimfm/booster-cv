import type { ComponentPropsWithRef } from 'react';
import { cx } from './cx';
import styles from './SegmentedToggle.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  /** Visible text and accessible name (e.g. "EN"); the group label gives the context. */
  label: string;
  /** Language of the label text, e.g. `nl` for "NL". */
  lang?: string;
}

export type SegmentedToggleProps<T extends string> = Omit<
  ComponentPropsWithRef<'div'>,
  'role' | 'aria-label' | 'onChange' | 'children'
> & {
  /** Group name (e.g. "Language"); becomes the group's `aria-label`. */
  label: string;
  /** 2–3 options. */
  options: readonly SegmentOption<T>[];
  value: T;
  onValueChange?: (value: T) => void;
  /** Static showcase: freeze one option (by value) in hover / focus. */
  stateFor?: { value: T; state: 'hover' | 'focus' };
};

/** EN | NL: a row of `aria-pressed` buttons in a labelled group. Controlled. */
export function SegmentedToggle<T extends string>({
  label,
  options,
  value,
  onValueChange,
  stateFor,
  className,
  ...rest
}: SegmentedToggleProps<T>) {
  return (
    <div role="group" aria-label={label} className={cx(styles.group, className)} {...rest}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={styles.segment}
          aria-pressed={o.value === value}
          {...(o.lang === undefined ? {} : { lang: o.lang })}
          {...(stateFor?.value === o.value ? { 'data-state': stateFor.state } : {})}
          onClick={() => {
            if (o.value !== value) onValueChange?.(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
