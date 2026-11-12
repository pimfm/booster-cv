import { expect, test } from './fixtures';

test.describe('F-05 harness', () => {
  test('openBox() moves sealed → box-open', async ({ app }) => {
    expect(await app.phase()).toBe('sealed');
    await app.openBox();
    expect(await app.phase()).toBe('box-open');
    await app.openBox(); // already open: a no-op
    expect(await app.phase()).toBe('box-open');
  });

  test('one pack, start to finish', async ({ app }) => {
    await app.openBox();
    const packId = await app.focusPack();
    await app.tearPack();
    expect(await app.phase()).toBe('revealing');

    const first = await app.drawCard();
    expect(first).not.toBe('');
    await app.openDetail();
    await expect(app.byTestId('card-detail')).toBeVisible();
    await app.closeDetail();
    expect(await app.phase()).toBe('card-on-stage');
    await app.collect();

    const collected = 1 + (await app.collectPack());
    await app.waitForPhase(['pack-complete', 'box-open']);
    await app.waitForPhase('box-open');
    const shelfPack = app.byTestId(`pack-${packId}`);
    await expect(shelfPack).toBeDisabled();
    expect(await app.binderCount()).toBe(Number(await shelfPack.getAttribute('data-count')));
    expect(await app.binderCount()).toBe(collected);
    await app.shot('F-05', 'one-pack');
  });

  test('keyboard hold with Space opens the box', async ({ app }) => {
    test.skip(app.traits.touch || app.traits.reduced, 'desktop, full motion');
    await app.holdKey('box', 'Space');
    await app.waitForPhase('box-open');
  });
});

test.describe('F-05 early release', () => {
  test.use({ holdMs: 600 });

  test('releasing early falls back to sealed and says "not yet"', async ({ app }) => {
    test.skip(app.traits.reduced, 'there is no hold under reduced motion');
    await app.holdFor('box', 150);
    expect(await app.phase()).toBe('sealed');
    await expect(app.byTestId('stage-copy')).toHaveAttribute('data-copy', 'hold_not_yet');
    await app.settle(); // the relax finishes
    expect(await app.phase()).toBe('sealed');
  });
});
