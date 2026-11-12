import type { CSSProperties } from 'react';
import packs from '@content/packs';
import en from '@content/strings.en';
import type { Card, Pack, Rarity } from '@/content/types';
import { PMark, RarityMark } from './primitives';
import { cx } from './tokens';
import styles from './card.module.css';

const TOTAL = packs.reduce((n, p) => n + p.cards.length, 0);

export function packOf(card: Card): Pack {
  const pack = packs.find((p) => p.cards.includes(card.id)) ?? packs[0];
  if (!pack) throw new Error('content has no packs');
  return pack;
}

export function cardNumber(card: Card): string {
  const index = packs.flatMap((p) => p.cards).indexOf(card.id) + 1;
  return en.card_number.replace('{n}', String(index).padStart(2, '0')).replace('{total}', String(TOTAL));
}

export function rarityLabel(rarity: Rarity): string {
  return en[`rarity_${rarity}`];
}

export function typeLine(card: Card): string {
  return card.typeLine?.en ?? `${packOf(card).name.en} · ${en[`kind_${card.kind}`]}`;
}

export function tintVar(pack: Pack): CSSProperties {
  return { '--tint': `var(--tint-${pack.tint})` } as CSSProperties;
}

export function rarityVar(rarity: Rarity): CSSProperties {
  return { '--rarity': `var(--rarity-${rarity})` } as CSSProperties;
}

/** The designed placeholder: pack tint, a big outlined initial, an `ART` corner label. */
export function PlaceholderArt({ title }: { title: string }) {
  const initial = title.replace(/^(the|a|an)\s+/i, '').charAt(0).toUpperCase();
  return (
    <div className={styles.art}>
      <span className={styles.crop} data-corner="tl" />
      <span className={styles.crop} data-corner="tr" />
      <span className={styles.crop} data-corner="br" />
      <span className={styles.initial} aria-hidden="true">
        {initial}
      </span>
      <span className={styles.artLabel}>{en.art_placeholder}</span>
    </div>
  );
}

export function StatBars({ card, max, large = false }: { card: Card; max?: number; large?: boolean }) {
  const stats = (card.stats ?? []).slice(0, max);
  if (stats.length === 0) return null;
  return (
    <dl className={cx(styles.stats, large && styles.statsLarge)}>
      {stats.map((stat) => (
        <div className={styles.stat} key={stat.label.en}>
          <dt>{stat.label.en}</dt>
          <dd>
            <span className={styles.segments} aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={cx(styles.segment, i < stat.value && styles.segmentOn)} />
              ))}
            </span>
            <span className={styles.statValue}>{stat.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface CardProps {
  card: Card;
  /** Card width in px; everything inside scales with it. */
  width?: number;
  flat?: boolean;
}

export function CardFront({ card, width = 300, flat = false }: CardProps) {
  const pack = packOf(card);
  const style = { ...tintVar(pack), ...rarityVar(card.rarity), '--card-w': `${width}px` } as CSSProperties;
  return (
    <article className={cx(styles.card, flat && styles.flat)} data-rarity={card.rarity} style={style}>
      <div className={styles.inner}>
        <header className={styles.titleBar}>
          <h4 className={styles.title}>{card.title.en}</h4>
          <span className={styles.titleMark} title={rarityLabel(card.rarity)}>
            <RarityMark rarity={card.rarity} />
          </span>
        </header>
        <PlaceholderArt title={card.title.en} />
        <div className={styles.body}>
          <p className={styles.typeLine}>{typeLine(card)}</p>
          <p className={styles.flavour}>{card.flavour.en}</p>
          <StatBars card={card} max={2} />
          <footer className={styles.footer}>
            <span className={styles.number}>{cardNumber(card)}</span>
            {card.tags?.[0] && <span className={styles.tag}>{card.tags[0].en}</span>}
          </footer>
        </div>
        {card.rarity === 'holo' && <span className={styles.band} aria-hidden="true" />}
      </div>
      <span className={styles.stamp} aria-hidden="true">
        <RarityMark rarity={card.rarity} />
      </span>
    </article>
  );
}

export function CardBack({ width = 300, label }: { width?: number; label: string }) {
  const style = { '--card-w': `${width}px` } as CSSProperties;
  return (
    <article className={cx(styles.card, styles.back)} style={style} aria-label={label}>
      <div className={styles.backInner}>
        <span className={styles.backCorner} data-corner="tl" />
        <span className={styles.backCorner} data-corner="tr" />
        <span className={styles.backCorner} data-corner="bl" />
        <span className={styles.backCorner} data-corner="br" />
        <PMark className={styles.backMark} />
        <span className={styles.backLabel}>{label}</span>
      </div>
    </article>
  );
}
