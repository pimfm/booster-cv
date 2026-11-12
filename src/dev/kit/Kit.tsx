import { useState, type ReactNode } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { ArrowRight, Keyboard, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { contrast, palette, type Rarity, type Tint } from '@/design/tokens';
import {
  Badge,
  Button,
  Chip,
  Frame,
  IconButton,
  Kbd,
  PMark,
  RarityMark,
  SegmentBar,
  SegmentedToggle,
  Toggle,
  VisuallyHidden,
  iconProps,
  type ButtonVariant,
} from '@/ui';
import styles from './Kit.module.css';

/* Dev-only page: literal English copy is allowed here (CLAUDE.md rule 1 covers the product). */

const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost'];
const states = ['default', 'hover', 'active', 'focus', 'disabled'] as const;
const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'holo'];
const tints: Tint[] = [1, 2, 3, 4, 5];
const tintNames: Record<Tint, string> = {
  1: 'Personality',
  2: 'Craft',
  3: 'At the table',
  4: 'Track record',
  5: 'Spare',
};
const steps = ['--step--1', '--step-0', '--step-1', '--step-2', '--step-3', '--step-4'] as const;
const langs = [
  { value: 'en', label: 'EN', lang: 'en' },
  { value: 'nl', label: 'NL', lang: 'nl' },
] as const;
type Lang = (typeof langs)[number]['value'];

const cssVar = (key: string) => `--${key.replace(/([A-Z])/g, '-$1').replace(/(\d)/, '-$1').toLowerCase()}`;
const ratio = (n: number) => `${n.toFixed(1)}:1`;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={`kit-${id}`}>
      <h2 id={`kit-${id}`} className={styles.h2}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className={styles.cell}>
      <div className={styles.cellBody}>{children}</div>
      <span className={styles.caption}>{caption}</span>
    </div>
  );
}

function stateProps(s: (typeof states)[number]) {
  if (s === 'disabled') return { disabled: true };
  if (s === 'default') return {};
  return { 'data-state': s };
}

export function Kit() {
  const [sound, setSound] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [muted, setMuted] = useState(true);
  const [replay, setReplay] = useState(0);
  const [size, setSize] = useState<'s' | 'm' | 'l'>('m');

  return (
    <LazyMotion features={domAnimation} strict>
      <main className={styles.page}>
        <header className={styles.header}>
          <PMark className={styles.headerMark} />
          <h1 className={styles.h1}>Primitive kit</h1>
          <span className={styles.meta}>src/ui · D-03</span>
        </header>

        <Section id="buttons" title="Button">
          <div className={styles.stateGrid}>
            {variants.map((v) => (
              <div key={v} className={styles.stateRow}>
                <span className={styles.rowLabel}>{v}</span>
                {states.map((s) => (
                  <Cell key={s} caption={s}>
                    <Button variant={v} {...stateProps(s)}>
                      Open box
                    </Button>
                  </Cell>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.row}>
            <Cell caption="md">
              <Button>Open box</Button>
            </Cell>
            <Cell caption="sm (44 px on touch)">
              <Button size="sm" variant="secondary">
                Reset
              </Button>
            </Cell>
            <Cell caption="leadingIcon">
              <Button variant="secondary" leadingIcon={<RotateCcw {...iconProps} />}>
                Start over
              </Button>
            </Cell>
            <Cell caption="trailingIcon">
              <Button trailingIcon={<ArrowRight {...iconProps} />}>Next pack</Button>
            </Cell>
            <Cell caption="kbd (fine pointer only)">
              <Button kbd="Space">Hold to open</Button>
            </Cell>
            <Cell caption="data-pressed">
              <Button data-pressed="">Holding</Button>
            </Cell>
          </div>
        </Section>

        <Section id="icon" title="IconButton">
          <div className={styles.row}>
            <Cell caption="default">
              <IconButton label="Close">
                <X {...iconProps} />
              </IconButton>
            </Cell>
            <Cell caption="hover">
              <IconButton label="Close" data-state="hover">
                <X {...iconProps} />
              </IconButton>
            </Cell>
            <Cell caption="active">
              <IconButton label="Close" data-state="active">
                <X {...iconProps} />
              </IconButton>
            </Cell>
            <Cell caption="focus">
              <IconButton label="Close" data-state="focus">
                <X {...iconProps} />
              </IconButton>
            </Cell>
            <Cell caption="disabled">
              <IconButton label="Close" disabled>
                <X {...iconProps} />
              </IconButton>
            </Cell>
            <Cell caption={`pressed=${String(!muted)} (try it)`}>
              <IconButton label="Sound" pressed={!muted} onClick={() => setMuted((x) => !x)}>
                {muted ? <VolumeX {...iconProps} /> : <Volume2 {...iconProps} />}
              </IconButton>
            </Cell>
            <Cell caption="pressed">
              <IconButton label="Shortcuts" pressed>
                <Keyboard {...iconProps} />
              </IconButton>
            </Cell>
          </div>
        </Section>

        <Section id="toggles" title="Toggle · SegmentedToggle">
          <div className={styles.row}>
            <Cell caption="off">
              <Toggle checked={false} label="Sound off" />
            </Cell>
            <Cell caption="on">
              <Toggle checked label="Sound on" />
            </Cell>
            <Cell caption="hover">
              <Toggle checked={false} label="Sound off" data-state="hover" />
            </Cell>
            <Cell caption="focus">
              <Toggle checked label="Sound on" data-state="focus" />
            </Cell>
            <Cell caption="disabled">
              <Toggle checked={false} label="Sound off" disabled />
            </Cell>
            <Cell caption="interactive">
              <Toggle checked={sound} label={sound ? 'Sound on' : 'Sound off'} onCheckedChange={setSound} />
            </Cell>
          </div>
          <div className={styles.row}>
            <Cell caption={`interactive (${lang})`}>
              <SegmentedToggle label="Language" options={langs} value={lang} onValueChange={setLang} />
            </Cell>
            <Cell caption="hover on NL">
              <SegmentedToggle label="Language" options={langs} value="en" stateFor={{ value: 'nl', state: 'hover' }} />
            </Cell>
            <Cell caption="focus on NL">
              <SegmentedToggle label="Language" options={langs} value="en" stateFor={{ value: 'nl', state: 'focus' }} />
            </Cell>
            <Cell caption="three options">
              <SegmentedToggle
                label="Size"
                options={[
                  { value: 's', label: 'S' },
                  { value: 'm', label: 'M' },
                  { value: 'l', label: 'L' },
                ]}
                value={size}
                onValueChange={setSize}
              />
            </Cell>
          </div>
        </Section>

        <Section id="marks" title="RarityMark · Badge · Chip · Kbd · PMark">
          <div className={styles.row}>
            {rarities.map((r) => (
              <Cell key={r} caption={r}>
                <span className={styles.bigMark}>
                  <RarityMark rarity={r} />
                </span>
              </Cell>
            ))}
          </div>
          <div className={styles.row}>
            <Cell caption="text">
              <Badge>New</Badge>
            </Cell>
            {rarities.map((r) => (
              <Cell key={r} caption={`rarity=${r}`}>
                <Badge rarity={r}>{r[0]?.toUpperCase() + r.slice(1)}</Badge>
              </Cell>
            ))}
          </div>
          <div className={styles.row}>
            <Cell caption="Chip">
              <span className={styles.inline}>
                <Chip>Kotlin</Chip>
                <Chip>Event sourcing</Chip>
                <Chip>Rules lawyer</Chip>
              </span>
            </Cell>
            <Cell caption="Kbd">
              <span className={styles.inline}>
                <Kbd>Space</Kbd>
                <Kbd>Esc</Kbd>
                <Kbd>?</Kbd>
              </span>
            </Cell>
            <Cell caption="PMark">
              <span className={styles.inline}>
                <PMark />
                <PMark className={styles.bigMark} />
                <PMark letter="K" />
              </span>
            </Cell>
            <Cell caption="VisuallyHidden (inside)">
              <span>
                Visible<VisuallyHidden> and announced</VisuallyHidden>
              </span>
            </Cell>
          </div>
        </Section>

        <Section id="frame" title="Frame">
          <div className={styles.row}>
            {([1, 2, 3] as const).map((b) => (
              <Frame key={b} className={styles.frameDemo} border={b}>
                <span className={styles.caption}>border={b}</span>
              </Frame>
            ))}
            {([0, 1, 2, 3] as const).map((s) => (
              <Frame key={s} className={styles.frameDemo} shadow={s}>
                <span className={styles.caption}>shadow={s}</span>
              </Frame>
            ))}
            <Frame className={styles.frameDemo} surface="paper-2">
              <span className={styles.caption}>paper-2</span>
            </Frame>
            <Frame className={styles.frameDemo} border={3} shadow={2} radius="card">
              <span className={styles.caption}>card radius</span>
            </Frame>
          </div>
        </Section>

        <Section id="tints" title="Dark on tint">
          <div className={styles.tintGrid}>
            {tints.map((t) => (
              <Frame key={t} as="article" className={styles.tintCard} tint={t} border={3} shadow={1} radius="card">
                <h3 className={styles.h3}>{tintNames[t]}</h3>
                <p className={styles.small}>Ink on tint-{t}: {ratio(contrast(palette.ink, palette[`tint${t}`]))}</p>
                <span className={styles.inline}>
                  <Badge rarity={rarities[t % 4] ?? 'common'}>Rarity</Badge>
                  <Chip>Chip</Chip>
                </span>
                <SegmentBar key={replay} value={t * 2} label="Stat" className={styles.tintBar} />
              </Frame>
            ))}
          </div>
        </Section>

        <Section id="segments" title="SegmentBar">
          <div className={styles.bars}>
            {[0, 3, 7, 10].map((v, i) => (
              <SegmentBar key={`${replay}-${v}`} value={v} label={`Value ${v}`} {...(i % 2 ? { tint: tints[i] ?? 1 } : {})} />
            ))}
            <SegmentBar key={`${replay}-big`} value={8} label="Large (em)" tint={2} className={styles.barLarge} />
          </div>
          <Button className={styles.start} size="sm" variant="secondary" leadingIcon={<RotateCcw {...iconProps} />} onClick={() => setReplay((n) => n + 1)}>
            Replay fill
          </Button>
        </Section>

        <Section id="tokens" title="Colour tokens">
          <div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Token</th>
                  <th scope="col">Swatch</th>
                  <th scope="col">Hex</th>
                  <th scope="col">vs ink</th>
                  <th scope="col">vs paper</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(palette).map(([key, hex]) => (
                  <tr key={key}>
                    <th scope="row">
                      <code>{cssVar(key)}</code>
                    </th>
                    <td>
                      <span className={styles.swatch} style={{ background: `var(${cssVar(key)})` }} />
                    </td>
                    <td>
                      <code>{hex}</code>
                    </td>
                    <td>{ratio(contrast(hex, palette.ink))}</td>
                    <td>{ratio(contrast(hex, palette.paper))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="type" title="Type">
          <div className={styles.fonts}>
            <Frame className={styles.fontCard} border={2} shadow={1}>
              <span className={styles.caption}>--font-display · Archivo Black 400</span>
              <span className={styles.displaySample}>Open the box</span>
              <span className={styles.displayAlphabet}>ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789</span>
            </Frame>
            <Frame className={styles.fontCard} border={2} shadow={1}>
              <span className={styles.caption}>--font-text · Inter Variable 400–700</span>
              <span className={styles.textSample}>
                Rules lawyer — benign variant. <strong>Bold 700</strong>, <em>italic for flavour</em>, 0123456789.
              </span>
            </Frame>
          </div>
          <ol className={styles.scale}>
            {steps.map((s) => (
              <li key={s} className={styles.scaleRow}>
                <code className={styles.caption}>{s}</code>
                <span className={styles.scaleSample} style={{ fontSize: `var(${s})` }}>
                  Sealed booster box
                </span>
              </li>
            ))}
          </ol>
        </Section>
      </main>
    </LazyMotion>
  );
}
