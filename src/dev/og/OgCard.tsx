import type { ContentBundle } from '@/content/types';
import { totalCards } from '@/content/bundle';
import { interpolate } from '@/platform/i18n';
import { CardBack, SealedBox, tintVar } from './SealedBox';
import styles from './og.module.css';

/** The three face-down cards fanned out behind the box: rotation (deg) and offset (px). */
const FAN = [
  { rotate: -20, x: -200, y: 40 },
  { rotate: -10, x: -128, y: -6 },
  { rotate: 0, x: -52, y: -30 },
] as const;

/**
 * The 1200×630 link-preview composition (PL-04). English only — crawlers get the English
 * defaults. Every word comes from /content; `scripts/og-render.mjs` screenshots it at @2x.
 */
export function OgCard({ bundle }: { bundle: ContentBundle }) {
  const { meta, packs, strings } = bundle;
  const en = strings.en;
  const counts = interpolate(en.box_counts, { cards: totalCards(bundle), packs: packs.length });
  return (
    <div className={styles.canvas} data-og="card">
      <section className={styles.copy}>
        <p className={styles.eyebrow}>
          <span className={styles.swatches}>
            {packs.map((p) => (
              <span key={p.id} className={styles.swatch} style={tintVar(p)} />
            ))}
          </span>
          <span>{counts}</span>
        </p>
        <h1 className={styles.title}>{meta.setName.en}</h1>
        <p className={styles.tagline}>{meta.tagline.en}</p>
      </section>
      <div className={styles.object}>
        <div className={styles.fan}>
          {FAN.map((f) => (
            <CardBack
              key={f.rotate}
              className={styles.fanCard}
              style={{ transform: `translate(${f.x}px, ${f.y}px) rotate(${f.rotate}deg)` }}
            />
          ))}
        </div>
        <div className={styles.boxHolder}>
          <SealedBox
            setName={meta.setName.en}
            fallbackName={meta.name}
            subtitle={en.box_subtitle}
            counts={counts}
            packs={packs}
          />
        </div>
      </div>
    </div>
  );
}

/** 180×180 apple-touch icon: the P mark, full-bleed (iOS rounds the corners itself). */
export function OgIcon() {
  return (
    <div className={styles.icon} data-og="icon">
      <span className={styles.iconP} aria-hidden="true">
        P
      </span>
    </div>
  );
}
