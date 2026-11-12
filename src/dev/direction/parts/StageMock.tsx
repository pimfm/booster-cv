import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { RotateCcw, Volume2 } from 'lucide-react';
import meta from '@content/meta';
import packs from '@content/packs';
import en from '@content/strings.en';
import type { Pack, Rarity } from '@/content/types';
import { tintVar, rarityVar } from './Card';
import { OpenedPack, PackObject } from './Objects';
import { IconButton, iconProps, Kbd, LangToggle, PMark } from './primitives';
import { cx } from './tokens';
import styles from './stage.module.css';

/** Renders a fixed-size composition and scales it down (never up) to the available width. */
export function Scaled({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setScale(Math.min(1, w / width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div ref={outer} className={styles.scaled} style={{ maxWidth: width, height: height * scale }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0' }}>{children}</div>
    </div>
  );
}

/* The mock's state: Personality is done, Craft is torn with one card collected. 5 of 17. */
const COLLECTED: Record<string, Rarity[]> = {
  personality: ['common', 'uncommon', 'rare', 'common'],
  craft: ['common'],
};
const TOTAL = packs.reduce((n, p) => n + p.cards.length, 0) + 1;
const DONE = Object.values(COLLECTED).reduce((n, list) => n + list.length, 0);
const PROGRESS = en.binder_progress.replace('{collected}', String(DONE)).replace('{total}', String(TOTAL));

function leftLabel(n: number): string {
  return (n === 1 ? en.cards_left.one : en.cards_left.other).replace('{n}', String(n));
}

function Header({ compact = false }: { compact?: boolean }) {
  return (
    <header className={cx(styles.header, compact && styles.headerCompact)}>
      <span className={styles.brand}>
        <PMark />
        <span className={styles.brandName}>{meta.name}</span>
        {!compact && <span className={styles.brandSet}>{en.box_subtitle}</span>}
      </span>
      <span className={styles.headerTools}>
        <LangToggle label={en.language} />
        <IconButton label={en.sound_on}>
          <Volume2 {...iconProps} />
        </IconButton>
        <IconButton label={en.reset}>
          <RotateCcw {...iconProps} />
        </IconButton>
      </span>
    </header>
  );
}

function ProgressBar() {
  return (
    <span className={styles.progress} aria-hidden="true">
      {packs.map((p) => {
        const got = COLLECTED[p.id]?.length ?? 0;
        return (
          <span key={p.id} className={styles.progressSeg}>
            <span className={styles.progressFill} style={{ width: `${(got / p.cards.length) * 100}%` }} />
          </span>
        );
      })}
    </span>
  );
}

function Slot({ pack, rarity, n }: { pack?: Pack; rarity?: Rarity | undefined; n: number }) {
  if (!pack || !rarity) {
    return <span className={styles.slot} aria-label={en.slot_empty.replace('{n}', String(n))} role="img" />;
  }
  return (
    <span
      className={cx(styles.slot, styles.slotFilled)}
      data-rarity={rarity}
      style={{ ...tintVar(pack), ...rarityVar(rarity) }}
    >
      <span className={styles.slotArt} />
      <span className={styles.slotStamp} />
    </span>
  );
}

function ShelfPack({ pack, width }: { pack: Pack; width: number }) {
  const got = COLLECTED[pack.id]?.length ?? 0;
  if (got === pack.cards.length) return <OpenedPack pack={pack} width={width} />;
  if (got > 0) return <OpenedPack pack={pack} width={width} note={leftLabel(pack.cards.length - got)} />;
  return <PackObject pack={pack} width={width} lifted={pack.id === 'table'} />;
}

export function DesktopMock() {
  let n = 0;
  return (
    <div className={styles.frame}>
      <Header />
      <div className={styles.desktopBody}>
        <main className={styles.stage}>
          <div className={styles.shelf}>
            <div className={styles.shelfPacks}>
              {packs.map((p) => (
                <ShelfPack key={p.id} pack={p} width={150} />
              ))}
            </div>
            <div className={styles.tray}>
              <span className={styles.trayName}>{meta.setName.en}</span>
              <span className={styles.trayCount}>
                {en.box_counts.replace('{cards}', String(TOTAL - 1)).replace('{packs}', String(packs.length))}
              </span>
            </div>
          </div>
          <p className={styles.hint}>{en.pick_pack}</p>
          <p className={styles.hintKeys}>
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
            <span>{en.shortcut_move}</span>
          </p>
        </main>
        <aside className={styles.rail}>
          <div className={styles.railHead}>
            <span className={styles.railTitle}>{en.binder}</span>
            <span className={styles.railCount}>{PROGRESS}</span>
            <ProgressBar />
          </div>
          <div className={styles.railGroups}>
            {packs.map((p) => (
              <section key={p.id} className={styles.group}>
                <h5 className={styles.groupName}>
                  <span className={styles.groupTint} style={tintVar(p)} />
                  {p.name.en}
                </h5>
                <div className={styles.slots}>
                  {p.cards.map((id, i) => (
                    <Slot key={id} pack={p} rarity={COLLECTED[p.id]?.[i]} n={++n} />
                  ))}
                </div>
              </section>
            ))}
            <section className={styles.group}>
              <h5 className={styles.groupName}>
                <span className={styles.groupTint} style={{ '--tint': 'var(--paper)' } as CSSProperties} />
                {en.kind_contact}
              </h5>
              <div className={styles.slots}>
                <Slot n={TOTAL} />
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function MobileMock() {
  let n = 0;
  return (
    <div className={cx(styles.frame, styles.mobile)}>
      <Header compact />
      <main className={cx(styles.stage, styles.stageMobile)}>
        <div className={styles.shelf}>
          <div className={cx(styles.shelfPacks, styles.shelfGrid)}>
            {packs.map((p) => (
              <ShelfPack key={p.id} pack={p} width={128} />
            ))}
          </div>
          <div className={styles.tray}>
            <span className={styles.trayName}>{meta.setName.en}</span>
          </div>
        </div>
        <p className={styles.hint}>{en.pick_pack}</p>
      </main>
      <aside className={styles.strip}>
        <div className={styles.stripHead}>
          <span className={styles.railTitle}>{en.binder}</span>
          <span className={styles.railCount}>{PROGRESS}</span>
          <ProgressBar />
        </div>
        <div className={styles.stripSlots}>
          {packs.map((p) => (
            <span key={p.id} className={styles.stripGroup}>
              {p.cards.map((id, i) => (
                <Slot key={id} pack={p} rarity={COLLECTED[p.id]?.[i]} n={++n} />
              ))}
            </span>
          ))}
        </div>
      </aside>
    </div>
  );
}
