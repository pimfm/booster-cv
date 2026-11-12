import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import meta from '@content/meta';
import packs from '@content/packs';
import en from '@content/strings.en';
import type { Pack } from '@/content/types';
import { tintVar } from './Card';
import { iconProps, PMark } from './primitives';
import { cx } from './tokens';
import styles from './objects.module.css';

const TOTAL = packs.reduce((n, p) => n + p.cards.length, 0);
const W = 150;
const H = 230;

/** Pack silhouette: straight sides, crimped (zigzag) top and bottom edges. */
function crimpedPath(): string {
  const teeth = 15;
  const step = W / teeth;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= teeth * 2; i++) {
    const x = (i * step) / 2;
    top.push(`${x.toFixed(1)},${i % 2 === 0 ? 7 : 1.5}`);
    bottom.push(`${(W - x).toFixed(1)},${i % 2 === 0 ? H - 7 : H - 1.5}`);
  }
  return `M${top.join(' L')} L${bottom.join(' L')} Z`;
}

/** Opened pack: the crimp is gone and the mouth is an uneven tear. */
function tornPath(): string {
  const tear = [
    [0, 44], [14, 38], [26, 45], [41, 36], [55, 43], [72, 37], [88, 46], [101, 39], [117, 44], [133, 36], [150, 42],
  ];
  const teeth = 15;
  const step = W / teeth;
  const bottom: string[] = [];
  for (let i = 0; i <= teeth * 2; i++) {
    const x = (i * step) / 2;
    bottom.push(`${(W - x).toFixed(1)},${i % 2 === 0 ? H - 7 : H - 1.5}`);
  }
  return `M${tear.map(([x, y]) => `${x},${y}`).join(' L')} L${bottom.join(' L')} Z`;
}

const CRIMPED = crimpedPath();
const TORN = tornPath();

function countLabel(n: number): string {
  return (n === 1 ? en.cards_count.one : en.cards_count.other).replace('{n}', String(n));
}

interface PackProps {
  pack: Pack;
  width?: number;
  lifted?: boolean;
}

export function PackObject({ pack, width = W, lifted = false }: PackProps) {
  const style = { ...tintVar(pack), '--pack-w': `${width}px` } as CSSProperties;
  return (
    <div className={cx(styles.pack, lifted && styles.lifted)} style={style}>
      <svg className={styles.packShape} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <path d={CRIMPED} />
        <line x1="1.5" y1="21" x2={W - 1.5} y2="21" />
        <line x1="1.5" y1={H - 21} x2={W - 1.5} y2={H - 21} />
      </svg>
      <div className={styles.packFace}>
        <span className={styles.packInitial} aria-hidden="true">
          {pack.name.en.charAt(0)}
        </span>
        <span className={styles.packPlate}>
          <span className={styles.packName}>{pack.name.en}</span>
        </span>
        <span className={styles.packCount}>{countLabel(pack.cards.length)}</span>
      </div>
    </div>
  );
}

export function OpenedPack({ pack, width = W, note }: PackProps & { note?: string }) {
  const style = { ...tintVar(pack), '--pack-w': `${width}px` } as CSSProperties;
  return (
    <div className={cx(styles.pack, styles.opened)} style={style}>
      <svg className={styles.packShape} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <path d={TORN} />
        <line x1="1.5" y1={H - 21} x2={W - 1.5} y2={H - 21} />
      </svg>
      <div className={styles.packFace}>
        <span className={styles.openedMark}>
          <Check {...iconProps} size={16} strokeWidth={3} />
        </span>
        <span className={styles.openedName}>{pack.name.en}</span>
        <span className={styles.packCount}>{note ?? en.opened}</span>
      </div>
    </div>
  );
}

/** The sealed box: front face, an offset lid/side face, and the wrap with its seam and tab. */
export function SealedBox() {
  const [setName = meta.name, setKind = ''] = meta.setName.en.split(' — ');
  const counts = en.box_counts.replace('{cards}', String(TOTAL)).replace('{packs}', String(packs.length));
  return (
    <div className={styles.box} role="img" aria-label={`${meta.setName.en}. ${counts}`}>
      <div className={styles.boxBody}>
        <div className={styles.boxTitle}>
          <span className={styles.boxName}>{setName}</span>
          <span className={styles.boxKind}>{setKind}</span>
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
        <span className={styles.boxSubtitle}>{en.box_subtitle}</span>
        <PMark className={styles.boxMark} />
      </div>
      <div className={styles.wrap}>
        <svg className={styles.seam} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon points="66,74 73,74 86,52 79,52" />
          <polygon points="76.5,74 79,74 92,52 89.5,52" />
          <line x1="0" y1="52" x2="100" y2="12" />
        </svg>
      </div>
      <span className={styles.wrapTab} />
    </div>
  );
}
