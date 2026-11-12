import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cardsInPack, totalWithContact } from '@/content/bundle';
import { getBundle } from '@/content/loader';
import en from '../../content/strings.en';
import nl from '../../content/strings.nl';
import { REDUCED_MOTION_QUERY } from '@/design/useMotionPrefs';
import { Experience } from './Experience';

const bundle = getBundle();
const originalMatchMedia = window.matchMedia;

function mockReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches: reduced && query === REDUCED_MOTION_QUERY,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

const phase = () => screen.getByRole('main').getAttribute('data-phase');
const live = () => screen.getByTestId('live-region').textContent;
const click = (testId: string) => fireEvent.click(screen.getByTestId(testId));

/** Collects every card of the focused pack through the stubs (after the pack is torn). */
function drawAndCollectAll(announced: string[]) {
  while (phase() === 'revealing') {
    click('reveal-stack');
    expect(phase()).toBe('card-on-stage');
    announced.push(live() ?? '');
    click('collect');
  }
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = '';
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.useRealTimers();
  delete window.__BOOSTER_HOLD_MS__;
});

describe('Experience shell (reduced motion: one press opens and tears)', () => {
  beforeEach(() => mockReducedMotion(true));

  it('renders every slot and the main attributes', () => {
    render(<Experience />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-phase', 'sealed');
    expect(main).toHaveAttribute('data-animating', 'false');
    for (const slot of ['header', 'stage', 'box', 'binder', 'live-region']) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(screen.getByTestId('stage-copy')).toHaveTextContent(en.hold_box);
    expect(screen.getByTestId('box-counts')).toHaveTextContent(
      `${bundle.cards.size} cards · ${bundle.packs.length} packs`,
    );
    expect(document.documentElement.lang).toBe('en');
  });

  it('drives the full loop to all-collected and announces along the way', () => {
    render(<Experience />);
    expect(live()).toBe(en.hold_box);

    click('box');
    expect(phase()).toBe('box-open');
    expect(live()).toBe(en.pick_pack);

    const announced: string[] = [];
    for (const pack of bundle.packs) {
      click(`pack-${pack.id}`);
      expect(phase()).toBe('pack-focused');
      expect(live()).toBe(en.hold_pack);
      click('focused-pack');
      expect(phase()).toBe('revealing');
      expect(live()).toBe(en.tap_to_draw);
      drawAndCollectAll(announced);
      expect(phase()).toBe('pack-complete');
      expect(live()).toBe(en.pack_done);
      fireEvent.pointerDown(document.body); // interrupts the 900 ms beat
    }

    // the contact card is drawn onto the stage by itself
    expect(phase()).toBe('card-on-stage');
    expect(screen.getByTestId('stage-card')).toHaveAttribute(
      'data-card-id',
      bundle.meta.contactCard.id,
    );
    expect(live()).toBe(`${bundle.meta.contactCard.title.en} — ${en.rarity_holo}`);
    click('collect');

    expect(phase()).toBe('all-collected');
    expect(live()).toBe(en.all_done);
    expect(screen.getByTestId('stage-copy')).toHaveTextContent(en.all_done);
    const total = totalWithContact(bundle);
    expect(screen.getByTestId('binder-count')).toHaveTextContent(`${total} / ${total}`);

    const first = cardsInPack(bundle, bundle.packs[0]!.id)[0]!;
    expect(announced[0]).toBe(`${first.title.en} — ${en[`rarity_${first.rarity}`]}`);
    expect(announced).toHaveLength(bundle.cards.size);
  });

  it('Read opens the detail, Esc closes it, collect from detail works', () => {
    render(<Experience />);
    click('box');
    const pack = bundle.packs[0]!;
    click(`pack-${pack.id}`);
    click('focused-pack');
    click('reveal-stack');
    click('read');
    expect(phase()).toBe('card-detail');
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByTestId('card-body')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(phase()).toBe('card-on-stage');
    click('read');
    click('detail-collect');
    expect(phase()).toBe('revealing');
    expect(screen.getByTestId('binder-count')).toHaveTextContent(`1 / ${totalWithContact(bundle)}`);

    // a filled binder slot opens its card; no collect button then
    const firstId = cardsInPack(bundle, pack.id)[0]!.id;
    expect(screen.getByTestId(`slot-${firstId}`)).toHaveAttribute('data-filled', 'true');
    click(`slot-${firstId}`);
    expect(screen.getByTestId('card-detail')).toHaveAttribute('data-card-id', firstId);
    expect(screen.queryByTestId('detail-collect')).toBeNull();
    click('close-detail');
    expect(phase()).toBe('revealing');
  });

  it('back to box and Esc unfocus a pack', () => {
    render(<Experience />);
    click('box');
    click(`pack-${bundle.packs[0]!.id}`);
    click('back-to-box');
    expect(phase()).toBe('box-open');
    click(`pack-${bundle.packs[1]!.id}`);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(phase()).toBe('box-open');
  });

  it('opened packs are disabled on the shelf', () => {
    render(<Experience />);
    click('box');
    const pack = bundle.packs[0]!;
    click(`pack-${pack.id}`);
    click('focused-pack');
    drawAndCollectAll([]);
    fireEvent.keyDown(window, { key: 'x' });
    expect(phase()).toBe('box-open');
    expect(screen.getByTestId(`pack-${pack.id}`)).toBeDisabled();
    expect(screen.getByTestId(`pack-${pack.id}`)).toHaveTextContent(en.opened);
  });

  it('reset returns to sealed and empties the binder', () => {
    render(<Experience />);
    click('box');
    click(`pack-${bundle.packs[0]!.id}`);
    click('focused-pack');
    click('reveal-stack');
    click('collect');
    click('reset');
    expect(phase()).toBe('sealed');
    expect(screen.getByTestId('binder-count')).toHaveTextContent(`0 / ${totalWithContact(bundle)}`);
  });

  it('the language toggle switches copy, <html lang> and persists', () => {
    render(<Experience />);
    click('lang-toggle');
    expect(document.documentElement.lang).toBe('nl');
    expect(screen.getByTestId('stage-copy')).toHaveTextContent(nl.hold_box);
    expect(window.localStorage.getItem('booster.locale')).toBe('nl');
    click('lang-toggle');
    expect(screen.getByTestId('stage-copy')).toHaveTextContent(en.hold_box);
  });
});

describe('Experience shell (full motion: holds)', () => {
  beforeEach(() => {
    mockReducedMotion(false);
    vi.useFakeTimers({
      toFake: [
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
        'setTimeout',
        'clearTimeout',
        'Date',
      ],
    });
    window.__BOOSTER_HOLD_MS__ = 200;
  });

  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  it('a click alone does not open the box; a held pointer does', () => {
    render(<Experience />);
    click('box');
    expect(phase()).toBe('sealed');
    fireEvent.pointerDown(screen.getByTestId('box'), {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
    });
    expect(phase()).toBe('unwrapping');
    expect(live()).toBe(en.opening);
    expect(screen.getByRole('main')).toHaveAttribute('data-animating', 'true');
    advance(260);
    expect(phase()).toBe('box-open');
    expect(screen.getByRole('main')).toHaveAttribute('data-animating', 'false');
  });

  it('an early release shows "not yet" for 1.6 s, then the hint again', () => {
    render(<Experience />);
    const box = screen.getByTestId('box');
    fireEvent.pointerDown(box, { pointerId: 1, button: 0, pointerType: 'mouse' });
    advance(80);
    fireEvent.pointerUp(box, { pointerId: 1 });
    expect(phase()).toBe('sealed');
    expect(live()).toBe(en.hold_not_yet);
    expect(screen.getByTestId('stage-copy')).toHaveTextContent(en.hold_not_yet);
    advance(1000);
    expect(screen.getByTestId('stage-copy')).toHaveTextContent(en.hold_not_yet);
    advance(700);
    expect(screen.getByTestId('stage-copy')).toHaveTextContent(en.hold_box);
  });

  it('Space held on the box opens it; key repeat does not restart the hold', () => {
    render(<Experience />);
    const box = screen.getByTestId('box');
    fireEvent.keyDown(box, { key: ' ' });
    advance(100);
    fireEvent.keyDown(box, { key: ' ', repeat: true });
    advance(140);
    expect(phase()).toBe('box-open');
  });

  it('a held pack tears; the pack-done beat ends by itself after 900 ms', () => {
    render(<Experience />);
    fireEvent.keyDown(screen.getByTestId('box'), { key: 'Enter' });
    advance(260);
    const pack = bundle.packs[0]!;
    click(`pack-${pack.id}`);
    const target = screen.getByTestId('focused-pack');
    fireEvent.pointerDown(target, { pointerId: 2, pointerType: 'touch' });
    expect(phase()).toBe('pack-tearing');
    advance(260);
    expect(phase()).toBe('revealing');
    for (let i = 0; i < cardsInPack(bundle, pack.id).length; i += 1) {
      click('reveal-stack');
      click('collect');
    }
    expect(phase()).toBe('pack-complete');
    advance(899);
    expect(phase()).toBe('pack-complete');
    advance(2);
    expect(phase()).toBe('box-open');
  });
});
