import { useId, type ReactNode } from 'react';
import type { Rarity } from '@/content/types';
import { cx } from './tokens';
import styles from './controls.module.css';

export type StaticState = 'default' | 'hover' | 'active' | 'focus' | 'disabled';

/** Pim's mark: an initial in a square. Used on the card back, the box, packs and the header. */
export function PMark({ className }: { className?: string | undefined }) {
  return (
    <span className={cx(styles.pmark, className)} aria-hidden="true">
      P
    </span>
  );
}

/** Rarity marks: one square, two squares, outlined diamond, diamond with a sharp band. */
export function RarityMark({ rarity, className }: { rarity: Rarity; className?: string | undefined }) {
  const clip = useId();
  const cls = cx(styles.mark, className);
  if (rarity === 'common') {
    return (
      <svg className={cls} viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
        <rect width="10" height="10" fill="currentColor" />
      </svg>
    );
  }
  if (rarity === 'uncommon') {
    return (
      <svg className={cls} viewBox="0 0 23 10" width="23" height="10" aria-hidden="true">
        <rect width="10" height="10" fill="currentColor" />
        <rect x="13" width="10" height="10" fill="currentColor" />
      </svg>
    );
  }
  const diamond = '8,1.6 14.4,8 8,14.4 1.6,8';
  return (
    <svg className={cx(cls, styles.markDiamond)} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      {rarity === 'holo' && (
        <>
          <clipPath id={clip}>
            <polygon points={diamond} />
          </clipPath>
          <polygon points="4.2,16 8.2,16 12.2,0 8.2,0" fill="currentColor" clipPath={`url(#${clip})`} />
        </>
      )}
      <polygon points={diamond} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
    </svg>
  );
}

export function Badge({ rarity, label }: { rarity: Rarity; label: string }) {
  return (
    <span className={styles.badge} data-rarity={rarity}>
      <span className={styles.badgeMark}>
        <RarityMark rarity={rarity} />
      </span>
      <span className={styles.badgeLabel}>{label}</span>
    </span>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className={styles.chip}>{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Freezes the button in one state, for the state sheet. */
  state?: StaticState;
  small?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', state = 'default', small = false, children }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(styles.button, styles[variant], small && styles.small, state !== 'default' && styles[`is-${state}`])}
      disabled={state === 'disabled'}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, children, small = false }: { label: string; children: ReactNode; small?: boolean }) {
  return (
    <button type="button" className={cx(styles.iconButton, small && styles.iconSmall)} aria-label={label}>
      {children}
    </button>
  );
}

export function Toggle({ on, label, focus = false }: { on: boolean; label: string; focus?: boolean }) {
  return (
    <span className={styles.toggleRow}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={cx(styles.toggle, on && styles.toggleOn, focus && styles['is-focus'])}
      >
        <span className={styles.thumb} />
      </button>
      <span className={styles.toggleLabel}>{label}</span>
    </span>
  );
}

/** EN | NL — a two-option segmented toggle. */
export function LangToggle({ label }: { label: string }) {
  return (
    <span className={styles.segmented} role="group" aria-label={label}>
      <button type="button" className={cx(styles.segment, styles.segmentOn)} aria-pressed="true">
        EN
      </button>
      <button type="button" className={styles.segment} aria-pressed="false">
        NL
      </button>
    </span>
  );
}

export const iconProps = {
  size: 20,
  strokeWidth: 2,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': true,
} as const;
