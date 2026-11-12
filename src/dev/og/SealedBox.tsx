import type { CSSProperties } from 'react';
import type { Pack } from '@/content/types';
import styles from './box.module.css';

/** `--tint` for a pack's swatch. */
export function tintVar(pack: Pack): CSSProperties {
  return { '--tint': `var(--tint-${pack.tint})` } as CSSProperties;
}

/** The brand mark: an ink-bordered mustard square with the display "P". */
export function PMark({ className }: { className?: string | undefined }) {
  return (
    <span className={[styles.pmark, className].filter(Boolean).join(' ')} aria-hidden="true">
      P
    </span>
  );
}

export interface SealedBoxProps {
  /** e.g. "Pim — Booster Box": the part before the dash is the big name, the rest the kind */
  setName: string;
  fallbackName: string;
  subtitle: string;
  counts: string;
  packs: Pack[];
}

/**
 * Static port of the Direction 1 sealed box (src/dev/direction/parts/Objects.tsx): body,
 * lid, wrap with seam and pull-tab. No motion; built for the OG image.
 */
export function SealedBox({ setName, fallbackName, subtitle, counts, packs }: SealedBoxProps) {
  const [name = fallbackName, kind = ''] = setName.split(' — ');
  return (
    <div className={styles.box} role="img" aria-label={`${setName}. ${counts}`}>
      <div className={styles.boxBody}>
        <div className={styles.boxTitle}>
          <span className={styles.boxName}>{name}</span>
          <span className={styles.boxKind}>{kind}</span>
        </div>
        <div className={styles.boxFoot}>
          <span className={styles.boxTints}>
            {packs.map((p) => (
              <span key={p.id} className={styles.boxTint} style={tintVar(p)} />
            ))}
          </span>
          <span className={styles.boxCounts}>{counts}</span>
        </div>
      </div>
      <div className={styles.boxLid}>
        <span className={styles.boxSubtitle}>{subtitle}</span>
        <PMark className={styles.boxMark} />
      </div>
      <div className={styles.wrap}>
        <svg
          className={styles.seam}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon points="66,74 73,74 86,52 79,52" />
          <polygon points="76.5,74 79,74 92,52 89.5,52" />
          <line x1="0" y1="52" x2="100" y2="12" />
        </svg>
      </div>
      <span className={styles.wrapTab} />
    </div>
  );
}

/** A face-down card: paper border, paper-2 field, diamond and the P mark. */
export function CardBack({
  className,
  style,
}: {
  className?: string | undefined;
  style?: CSSProperties;
}) {
  return (
    <div
      className={[styles.back, className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
    >
      <div className={styles.backInner}>
        <span className={styles.backCorner} data-corner="tl" />
        <span className={styles.backCorner} data-corner="tr" />
        <span className={styles.backCorner} data-corner="bl" />
        <span className={styles.backCorner} data-corner="br" />
        <PMark className={styles.backMark} />
      </div>
    </div>
  );
}
