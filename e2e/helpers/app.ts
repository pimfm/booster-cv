/**
 * The `app` driver used by every story spec (see e2e/README.md).
 * Each helper is idempotent where that makes sense: called when the phase has already
 * moved past its goal, it returns instead of failing.
 */
import { expect } from '@playwright/test';
import type { Locator, Page, TestInfo } from '@playwright/test';

export type Phase =
  | 'sealed'
  | 'unwrapping'
  | 'box-open'
  | 'pack-focused'
  | 'pack-tearing'
  | 'revealing'
  | 'card-on-stage'
  | 'card-detail'
  | 'pack-complete'
  | 'all-collected'
  | 'resetting';

export interface ProjectTraits {
  /** the project runs with `reducedMotion: 'reduce'`: one press opens / tears */
  reduced: boolean;
  /** a touch device: holds are dispatched as touch pointer events */
  touch: boolean;
}

export function projectTraits(testInfo: TestInfo): ProjectTraits {
  const use = testInfo.project.use;
  return {
    reduced: use.contextOptions?.reducedMotion === 'reduce' || use.reducedMotion === 'reduce',
    touch: use.hasTouch === true,
  };
}

/** Slack on top of the hold duration before releasing: rAF ticks are clamped to 64 ms. */
const HOLD_SLACK_MS = 100;

export interface App {
  readonly page: Page;
  readonly traits: ProjectTraits;
  readonly holdMs: number;
  /** `main[data-phase]` */
  phase(): Promise<Phase>;
  waitForPhase(phase: Phase | readonly Phase[]): Promise<void>;
  /** waits for `main[data-animating="false"]` */
  settle(): Promise<void>;
  /** press-and-hold (or one click under reduced motion) on `[data-testid=testId]` */
  hold(testId: string): Promise<void>;
  /** press and release after `ms` (an early release when `ms < holdMs`) */
  holdFor(testId: string, ms: number): Promise<void>;
  /** keyboard hold: focus, `keyboard.down(key)`, wait, `keyboard.up(key)` (a press when reduced) */
  holdKey(testId: string, key?: 'Space' | 'Enter'): Promise<void>;
  /** sealed → box-open */
  openBox(): Promise<void>;
  /** box-open → pack-focused; no id: the first pack on the shelf that is not opened */
  focusPack(id?: string): Promise<string>;
  /** pack-focused → revealing */
  tearPack(): Promise<void>;
  /** revealing → card-on-stage; returns the card id */
  drawCard(): Promise<string>;
  /** card-on-stage → card-detail */
  openDetail(): Promise<void>;
  /** card-detail → where it came from */
  closeDetail(): Promise<void>;
  /** puts the stage card in the binder (from the stage or the detail panel) */
  collect(): Promise<void>;
  /** draws and collects until the focused pack is done */
  collectPack(): Promise<number>;
  /** cards in the binder */
  binderCount(): Promise<number>;
  /** `e2e/__screens__/<storyId>-<name>-<project>.png`, full page, after `settle()` */
  shot(storyId: string, name: string): Promise<string>;
  byTestId(testId: string): Locator;
}

export function createApp(page: Page, testInfo: TestInfo, holdMs: number): App {
  const traits = projectTraits(testInfo);
  const main = page.locator('main[data-phase]');
  const byTestId = (testId: string) => page.getByTestId(testId);

  const phase = async () => (await main.getAttribute('data-phase')) as Phase;

  const waitForPhase = async (want: Phase | readonly Phase[]) => {
    const list: readonly Phase[] = typeof want === 'string' ? [want] : want;
    await expect
      .poll(phase, { message: `phase should become ${list.join(' | ')}`, intervals: [20, 50, 100] })
      .toMatch(new RegExp(`^(${list.join('|')})$`));
  };

  /** Releases on the element if it is still there; it unmounts when the hold completes. */
  const releasePointer = (target: Locator, type: 'pointerup' | 'pointercancel') =>
    target.evaluateAll((elements, eventType) => {
      for (const element of elements) {
        element.dispatchEvent(
          new PointerEvent(eventType, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'touch',
            isPrimary: true,
          }),
        );
      }
    }, type);

  const press = async (testId: string, ms: number) => {
    const target = byTestId(testId);
    if (traits.touch) {
      await target.dispatchEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: 1,
      });
      await page.waitForTimeout(ms);
      await releasePointer(target, 'pointerup');
      return;
    }
    await target.hover();
    await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.mouse.up();
  };

  const hold = async (testId: string) => {
    if (traits.reduced) {
      await byTestId(testId).click();
      return;
    }
    await press(testId, holdMs + HOLD_SLACK_MS);
  };

  const holdFor = (testId: string, ms: number) => press(testId, ms);

  const holdKey = async (testId: string, key: 'Space' | 'Enter' = 'Space') => {
    await byTestId(testId).focus();
    if (traits.reduced) {
      await page.keyboard.press(key);
      return;
    }
    await page.keyboard.down(key);
    await page.waitForTimeout(holdMs + HOLD_SLACK_MS);
    await page.keyboard.up(key);
  };

  const binderCount = async () =>
    Number(await byTestId('binder-count').getAttribute('data-collected'));

  const openBox = async () => {
    if (!['sealed', 'unwrapping'].includes(await phase())) return;
    await hold('box');
    await waitForPhase('box-open');
  };

  const focusPack = async (id?: string) => {
    if ((await phase()) === 'pack-focused') {
      const current = await byTestId('focused-pack').getAttribute('data-pack-id');
      if (id === undefined || current === id) return current ?? '';
      await byTestId('back-to-box').click();
    }
    await waitForPhase('box-open');
    const packId =
      id ??
      (await page
        .locator('[data-slot="pack-shelf"] [data-pack-id][data-opened="false"]')
        .first()
        .getAttribute('data-pack-id'));
    if (packId === null) throw new Error('focusPack(): every pack is opened');
    await byTestId(`pack-${packId}`).click();
    await waitForPhase('pack-focused');
    return packId;
  };

  const tearPack = async () => {
    if (!['pack-focused', 'pack-tearing'].includes(await phase())) return;
    await hold('focused-pack');
    await waitForPhase(['revealing', 'pack-complete']);
  };

  const stageCardId = async () => (await byTestId('stage-card').getAttribute('data-card-id')) ?? '';

  const drawCard = async () => {
    // The stack ignores input while it rises (INTERACTION-SPEC §3), so retry the click;
    // in all-collected the contact card is drawn by itself.
    await expect(async () => {
      if ((await phase()) === 'revealing') await byTestId('reveal-stack').click({ timeout: 1_000 });
      expect(await phase()).toBe('card-on-stage');
    }).toPass({ intervals: [100, 150, 250], timeout: 5_000 });
    return stageCardId();
  };

  const openDetail = async () => {
    if ((await phase()) === 'card-detail') return;
    await byTestId('read').click();
    await waitForPhase('card-detail');
  };

  const closeDetail = async () => {
    if ((await phase()) !== 'card-detail') return;
    await byTestId('close-detail').click();
    await expect(main).not.toHaveAttribute('data-phase', 'card-detail');
  };

  const collect = async () => {
    const now = await phase();
    if (now !== 'card-on-stage' && now !== 'card-detail') return;
    const before = await binderCount();
    await byTestId(now === 'card-detail' ? 'detail-collect' : 'collect').click();
    await expect.poll(binderCount, { intervals: [20, 50, 100] }).toBe(before + 1);
  };

  const collectPack = async () => {
    let n = 0;
    for (;;) {
      const now = await phase();
      if (now !== 'revealing' && now !== 'card-on-stage' && now !== 'card-detail') return n;
      await drawCard();
      await collect();
      n += 1;
    }
  };

  const settle = () => expect(main).toHaveAttribute('data-animating', 'false');

  const shot = async (storyId: string, name: string) => {
    await settle();
    const path = `e2e/__screens__/${storyId}-${name}-${testInfo.project.name}.png`;
    await page.screenshot({ path, fullPage: true });
    return path;
  };

  return {
    page,
    traits,
    holdMs,
    phase,
    waitForPhase,
    settle,
    hold,
    holdFor,
    holdKey,
    openBox,
    focusPack,
    tearPack,
    drawCard,
    openDetail,
    closeDetail,
    collect,
    collectPack,
    binderCount,
    shot,
    byTestId,
  };
}
