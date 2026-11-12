import { createElement, type ElementType, type HTMLAttributes, type Ref } from 'react';
import type { Tint } from '@/design/tokens';
import { cx } from './cx';
import styles from './Frame.module.css';

export type FrameProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  /** Element to render. Default `div`. */
  as?: ElementType;
  /** `--border-1/2/3` (2 / 3 / 4 px). Default 2. */
  border?: 1 | 2 | 3;
  /** `--shadow-0..3` (2 / 4 / 8 / 12 px). Default `'none'`. */
  shadow?: 0 | 1 | 2 | 3 | 'none';
  /** Pack tint fill (`--tint-n`); wins over `surface`. Text stays ink. */
  tint?: Tint;
  /** Default `paper`. */
  surface?: 'paper' | 'paper-2';
  /** `ui` = 2 px, `card` = 12 px. Default `ui`. */
  radius?: 'ui' | 'card';
};

/** The bordered box: the base of cards, packs and panels. */
export function Frame({
  as = 'div',
  border = 2,
  shadow = 'none',
  tint,
  surface = 'paper',
  radius = 'ui',
  className,
  ...rest
}: FrameProps) {
  return createElement(as, {
    className: cx(styles.frame, className),
    'data-border': border,
    'data-shadow': shadow,
    'data-surface': tint === undefined ? surface : `tint-${tint}`,
    'data-radius': radius,
    ...rest,
  });
}
