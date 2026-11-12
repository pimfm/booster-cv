import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import common from '@content/cards/craft-01';
import rare from '@content/cards/personality-03';
import holo from '@content/cards/table-03';
import meta from '@content/meta';
import packs from '@content/packs';
import en from '@content/strings.en';
import type { Rarity } from '@/content/types';
import baseCss from '@/design/tokens.css?raw';
import { CardBack, CardFront, cardNumber, packOf, rarityLabel, StatBars, tintVar, typeLine } from './parts/Card';
import { OpenedPack, PackObject, SealedBox } from './parts/Objects';
import {
  Badge,
  Button,
  Chip,
  IconButton,
  iconProps,
  Kbd,
  LangToggle,
  Toggle,
  type StaticState,
} from './parts/primitives';
import { DesktopMock, MobileMock, Scaled } from './parts/StageMock';
import { clampRange, contrast, cx, parseTokens, resolveToken, type TokenMap } from './parts/tokens';
import styles from './StyleTile.module.css';

export interface DirectionSpec {
  id: 1 | 2;
  /** Scope class defined in src/design/directions/directionN.css */
  scope: string;
  name: string;
  mood: [string, string];
  /** Raw source of the direction's token file. */
  tokensCss: string;
  display: { name: string; note: string };
  text: { name: string; note: string };
  /** The DESIGN-BRIEF §1 "what varies" row for this direction. */
  varies: { label: string; value: string }[];
  rarityStyle: 'frame' | 'stamp';
  stage: 'dots' | 'slab';
  stageNotes: string[];
}

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'holo'];
const STATES: { state: StaticState; label: string }[] = [
  { state: 'default', label: 'Default' },
  { state: 'hover', label: 'Hover' },
  { state: 'active', label: 'Pressed' },
  { state: 'focus', label: 'Focus' },
  { state: 'disabled', label: 'Disabled' },
];
const SCALE: { token: string; face: 'display' | 'text'; sample: string; italic?: boolean }[] = [
  { token: '--step-4', face: 'display', sample: meta.setName.en },
  { token: '--step-3', face: 'display', sample: en.pick_pack },
  { token: '--step-2', face: 'display', sample: holo.title.en },
  { token: '--step-1', face: 'display', sample: en.hold_not_yet },
  { token: '--step-0', face: 'text', sample: rare.flavour.en, italic: true },
  { token: '--step--1', face: 'text', sample: `${typeLine(rare)}  ${cardNumber(rare)}` },
];

function Section({ id, title, note, wide, children }: { id: string; title: string; note: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={cx(styles.section, wide && styles.sectionWide)} aria-labelledby={id}>
      <div className={styles.sectionHead}>
        <h2 id={id} className={styles.sectionTitle}>
          {title}
        </h2>
        <p className={styles.sectionNote}>{note}</p>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Swatch({ tokens, name }: { tokens: TokenMap; name: string }) {
  const value = resolveToken(tokens, name);
  const ink = resolveToken(tokens, '--ink');
  const paper = resolveToken(tokens, '--paper');
  const withInk = contrast(ink, value);
  const withPaper = contrast(paper, value);
  const useInk = withInk >= withPaper;
  const ratio = useInk ? withInk : withPaper;
  return (
    <li className={styles.swatch}>
      <span
        className={styles.swatchFill}
        style={{ background: `var(${name})`, color: useInk ? 'var(--ink)' : 'var(--paper)' }}
      >
        <span className={styles.swatchRatio}>{ratio.toFixed(1)}:1</span>
        <span className={styles.swatchOn}>
          {useInk ? 'ink' : 'paper'} text {ratio >= 4.5 ? 'passes AA' : 'fails AA'}
        </span>
      </span>
      <span className={styles.swatchName}>{name}</span>
      <span className={styles.swatchValue}>{value}</span>
    </li>
  );
}

function SwatchGroup({ tokens, title, names }: { tokens: TokenMap; title: string; names: string[] }) {
  return (
    <div className={styles.swatchGroup}>
      <h3 className={styles.subhead}>{title}</h3>
      <ul className={styles.swatches}>
        {names.map((n) => (
          <Swatch key={n} tokens={tokens} name={n} />
        ))}
      </ul>
    </div>
  );
}

function Figure({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className={styles.figure}>
      {children}
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}

export function StyleTile({ spec }: { spec: DirectionSpec }) {
  const tokens = parseTokens(baseCss, spec.tokensCss);
  const other = spec.id === 1 ? 2 : 1;
  const detailPack = packOf(rare);

  return (
    <div className={cx(spec.scope, styles.page)} data-rarity-style={spec.rarityStyle} data-stage={spec.stage}>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Directions">
          <span className={styles.navTitle}>booster-cv style tile</span>
          <span className={styles.navLinks}>
            <span className={cx(styles.navLink, styles.navCurrent)} aria-current="page">
              Direction {spec.id}
            </span>
            <a className={styles.navLink} href={`/dev/direction/${other}`}>
              Direction {other}
            </a>
          </span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.heroName}>{spec.name}</h1>
            <p className={styles.heroMood}>
              {spec.mood[0]} {spec.mood[1]}
            </p>
            <dl className={styles.varies}>
              {spec.varies.map((row) => (
                <div key={row.label} className={styles.variesRow}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className={styles.heroCards} aria-hidden="true">
            <div className={styles.heroBack}>
              <CardBack width={232} label={meta.setName.en} />
            </div>
            <div className={styles.heroFront}>
              <CardFront card={rare} width={232} />
            </div>
          </div>
        </header>

        <Section id="palette" title="Palette" note="Each swatch prints the contrast of the text colour that sits on it. 4.5:1 is the floor.">
          <div className={styles.paletteGrid}>
            <SwatchGroup tokens={tokens} title="Ink and paper" names={['--ink', '--ink-2', '--paper', '--paper-2']} />
            <SwatchGroup tokens={tokens} title="Accents" names={['--accent-1', '--accent-2']} />
            <SwatchGroup
              tokens={tokens}
              title="Pack tints"
              names={['--tint-1', '--tint-2', '--tint-3', '--tint-4', '--tint-5']}
            />
            <SwatchGroup tokens={tokens} title="Rarity" names={RARITIES.map((r) => `--rarity-${r}`)} />
          </div>
        </Section>

        <Section id="type" title="Type" note="Two families. Display for headings and card titles, text for everything you read.">
          <div className={styles.faces}>
            <div className={styles.face}>
              <p className={cx(styles.faceSample, styles.display)}>Aa</p>
              <div>
                <p className={styles.faceName}>{spec.display.name}</p>
                <p className={styles.faceNote}>{spec.display.note}</p>
              </div>
            </div>
            <div className={styles.face}>
              <p className={cx(styles.faceSample, styles.faceSampleText)}>Aa</p>
              <div>
                <p className={styles.faceName}>{spec.text.name}</p>
                <p className={styles.faceNote}>{spec.text.note}</p>
              </div>
            </div>
          </div>
          <ul className={styles.scale}>
            {SCALE.map((row) => (
              <li key={row.token} className={styles.scaleRow}>
                <span className={styles.scaleMeta}>
                  <span className={styles.scaleToken}>{row.token}</span>
                  <span className={styles.scaleSize}>{clampRange(resolveToken(tokens, row.token))}</span>
                </span>
                <span
                  className={cx(styles.scaleSample, row.face === 'display' && styles.display, row.italic && styles.italic)}
                  style={{ fontSize: `var(${row.token})` }}
                >
                  {row.sample}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="controls" title="Controls" note="Buttons press: the shadow collapses and the button moves into its place.">
          <div className={styles.controlBlock}>
            <h3 className={styles.subhead}>Button</h3>
            <div className={styles.stateGrid}>
              <span />
              {STATES.map((s) => (
                <span key={s.state} className={styles.stateLabel}>
                  {s.label}
                </span>
              ))}
              {(['primary', 'secondary', 'ghost'] as const).map((variant) => (
                <div key={variant} className={styles.stateRow}>
                  <span className={styles.variantLabel}>{variant}</span>
                  {STATES.map((s) => (
                    <span key={s.state} className={styles.stateCell} data-state={s.label}>
                      <Button variant={variant} state={s.state}>
                        {variant === 'primary' ? en.collect : variant === 'secondary' ? en.read_more : en.reset}
                      </Button>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.controlColumns}>
            <div className={styles.controlBlock}>
              <h3 className={styles.subhead}>Toggle and icon buttons</h3>
              <div className={styles.row}>
                <Toggle on={false} label={en.sound_off} />
                <Toggle on label={en.sound_on} />
                <Toggle on label="Focus" focus />
              </div>
              <div className={styles.row}>
                <LangToggle label={en.language} />
                <IconButton label={en.close}>
                  <X {...iconProps} />
                </IconButton>
              </div>
            </div>
            <div className={styles.controlBlock}>
              <h3 className={styles.subhead}>Rarity marks</h3>
              <div className={styles.row}>
                {RARITIES.map((r) => (
                  <Badge key={r} rarity={r} label={rarityLabel(r)} />
                ))}
              </div>
            </div>
            <div className={styles.controlBlock}>
              <h3 className={styles.subhead}>Chips</h3>
              <div className={styles.row}>
                <Chip>{rare.tags?.[0]?.en}</Chip>
                <Chip>{common.tags?.[0]?.en}</Chip>
                <Chip>{en.kind_table}</Chip>
              </div>
            </div>
            <div className={styles.controlBlock}>
              <h3 className={styles.subhead}>Keyboard hints</h3>
              <div className={styles.row}>
                <span className={styles.kbdHint}>
                  <Kbd>Space</Kbd> {en.shortcut_hold}
                </span>
                <span className={styles.kbdHint}>
                  <Kbd>Esc</Kbd> {en.shortcut_back}
                </span>
              </div>
            </div>
            <div className={styles.controlBlock}>
              <h3 className={styles.subhead}>Borders and shadows</h3>
              <div className={styles.row}>
                <span className={styles.geo} style={{ borderWidth: 'var(--border-1)' }}>
                  2
                </span>
                <span className={styles.geo} style={{ borderWidth: 'var(--border-2)', boxShadow: 'var(--shadow-1)' }}>
                  3 / 4
                </span>
                <span className={styles.geo} style={{ borderWidth: 'var(--border-3)', boxShadow: 'var(--shadow-2)' }}>
                  4 / 8
                </span>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="cards"
          title="Cards"
          note="Real content objects, placeholder art. The front shows two stats; the detail view shows all of them."
          wide
        >
          <div className={styles.cardRow}>
            <Figure caption={rarityLabel('common')}>
              <CardFront card={common} />
            </Figure>
            <Figure caption={rarityLabel('rare')}>
              <CardFront card={rare} />
            </Figure>
            <Figure caption={`${rarityLabel('holo')}, band shown at rest`}>
              <CardFront card={holo} />
            </Figure>
            <Figure caption="Back">
              <CardBack label={meta.setName.en} />
            </Figure>
          </div>

          <h3 className={cx(styles.subhead, styles.subheadSpaced)}>Detail view</h3>
          <div className={styles.detail} style={tintVar(detailPack)}>
            <div className={styles.detailCard}>
              <CardFront card={rare} width={280} flat />
            </div>
            <div className={styles.detailText}>
              <p className={styles.detailType}>
                {typeLine(rare)} <span className={styles.detailNumber}>{cardNumber(rare)}</span>
              </p>
              <h4 className={styles.detailTitle}>{rare.title.en}</h4>
              <Badge rarity={rare.rarity} label={rarityLabel(rare.rarity)} />
              <p className={styles.detailFlavour}>{rare.flavour.en}</p>
              {rare.body.en.split('\n\n').map((p) => (
                <p key={p} className={styles.detailBody}>
                  {p}
                </p>
              ))}
              <div className={styles.detailStats}>
                <StatBars card={rare} large />
              </div>
              <div className={styles.row}>
                {rare.tags?.map((t) => <Chip key={t.en}>{t.en}</Chip>)}
                <Chip>{en.kind_trait}</Chip>
              </div>
              <div className={cx(styles.row, styles.detailActions)}>
                <Button variant="primary">{en.collect}</Button>
                <Button variant="secondary">{en.close}</Button>
              </div>
            </div>
            <span className={styles.detailClose}>
              <IconButton label={en.close}>
                <X {...iconProps} />
              </IconButton>
            </span>
          </div>
        </Section>

        <Section id="objects" title="Objects" note="The sealed box, a pack, and a pack after it has been opened.">
          <div className={styles.objects}>
            <Figure caption={en.hold_box}>
              <SealedBox />
            </Figure>
            <Figure caption={en.hold_pack}>
              {packs[0] && <PackObject pack={packs[0]} width={170} />}
            </Figure>
            <Figure caption="Hover and focus lift">{packs[2] && <PackObject pack={packs[2]} width={170} lifted />}</Figure>
            <Figure caption={en.opened}>{packs[1] && <OpenedPack pack={packs[1]} width={170} />}</Figure>
          </div>
        </Section>

        <Section id="stage" title="Stage" note="Static compositions of the shelf state: one pack done, one torn, two sealed." wide>
          <h3 className={styles.subhead}>Desktop, 1100 × 620</h3>
          <div className={styles.mockDesktop}>
            <Scaled width={1100} height={620}>
              <DesktopMock />
            </Scaled>
          </div>
          <div className={styles.mockRow}>
            <div className={styles.mockMobile}>
              <h3 className={styles.subhead}>Mobile, 390 × 760</h3>
              <Scaled width={390} height={760}>
                <MobileMock />
              </Scaled>
            </div>
            <div className={styles.mockNotes}>
              <h3 className={styles.subhead}>What this direction does on stage</h3>
              <ul className={styles.notes}>
                {spec.stageNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <a className={styles.otherLink} href={`/dev/direction/${other}`}>
                Compare with direction {other}
              </a>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
