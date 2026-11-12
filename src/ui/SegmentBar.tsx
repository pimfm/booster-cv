import { useId, type ComponentPropsWithRef, type CSSProperties } from 'react';
import { m } from 'framer-motion';
import { tintToken, tokens, type Tint } from '@/design/tokens';
import { useMotionPrefs } from '@/design/useMotionPrefs';
import { cx } from './cx';
import styles from './SegmentBar.module.css';

/**
 * Seconds between segments filling. Not in motion.ts yet (Request: `stagger.segment`);
 * kept here, named, so it moves there unchanged.
 */
const SEGMENT_STAGGER = 0.02;
const SEGMENTS = 10;

export type SegmentBarProps = Omit<ComponentPropsWithRef<'div'>, 'role' | 'children'> & {
  /** 0–10; rounded and clamped. */
  value: number;
  /** Visible label (from content); also names the meter. */
  label: string;
  /** Fill colour `--tint-n`. Default ink. */
  tint?: Tint;
  /** Show the number after the bar. Default true. */
  showValue?: boolean;
};

/** A stat as ten bordered squares. Fills on mount with `spring.settle`, 20 ms per segment. */
export function SegmentBar({
  value,
  label,
  tint,
  showValue = true,
  className,
  style,
  ...rest
}: SegmentBarProps) {
  const { reduced, spring } = useMotionPrefs();
  const labelId = useId();
  const n = Math.max(0, Math.min(SEGMENTS, Math.round(value)));
  const fill = tint === undefined ? tokens.ink : tintToken(tint);
  const settle = spring('settle');
  return (
    <div
      role="meter"
      aria-labelledby={labelId}
      aria-valuenow={n}
      aria-valuemin={0}
      aria-valuemax={SEGMENTS}
      className={cx(styles.bar, className)}
      style={{ ...style, '--segment-fill': fill } as CSSProperties}
      {...rest}
    >
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <span className={styles.segments} aria-hidden="true">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span key={i} className={styles.segment} data-on={i < n ? '' : undefined}>
            {i < n && (
              <m.span
                className={styles.fill}
                initial={reduced ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={reduced ? settle : { ...settle, delay: i * SEGMENT_STAGGER }}
              />
            )}
          </span>
        ))}
      </span>
      {showValue && (
        <span className={styles.value} aria-hidden="true">
          {n}
        </span>
      )}
    </div>
  );
}
