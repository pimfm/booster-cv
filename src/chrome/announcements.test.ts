import { createBundle } from '@/content/bundle';
import { makeParts } from '@/content/testkit';
import { initialState } from '@/machine';
import type { ExperienceState } from '@/machine';
import { translate } from '@/platform/i18n';
import en from '../../content/strings.en';
import { announcementFor } from './announcements';

const bundle = createBundle(makeParts());
const i18n = {
  t: (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate(en, key, vars),
  L: (text: { en: string }) => text.en,
};
const s = (extra: Partial<ExperienceState>): ExperienceState => ({ ...initialState(), ...extra });
const say = (prev: ExperienceState | null, next: ExperienceState) =>
  announcementFor(prev, next, bundle, i18n);

describe('announcementFor', () => {
  it('maps phases to messages', () => {
    expect(say(null, s({}))).toBe(en.hold_box);
    expect(say(s({}), s({ phase: 'unwrapping' }))).toBe(en.opening);
    expect(say(s({ phase: 'pack-focused' }), s({ phase: 'pack-tearing' }))).toBe(en.opening);
    expect(say(s({ phase: 'unwrapping' }), s({ phase: 'box-open' }))).toBe(en.pick_pack);
    expect(say(s({ phase: 'box-open' }), s({ phase: 'pack-focused' }))).toBe(en.hold_pack);
    expect(say(s({ phase: 'pack-tearing' }), s({ phase: 'revealing' }))).toBe(en.tap_to_draw);
    expect(say(s({ phase: 'revealing' }), s({ phase: 'card-on-stage', stageCardId: 'a' }))).toBe(
      'Card a — Common',
    );
    expect(say(s({ phase: 'card-on-stage' }), s({ phase: 'pack-complete' }))).toBe(en.pack_done);
    expect(say(s({ phase: 'card-on-stage' }), s({ phase: 'all-collected' }))).toBe(en.all_done);
  });

  it('stays quiet when nothing worth saying happened', () => {
    const same = s({ phase: 'unwrapping', holdProgress: 0.2 });
    expect(say(same, { ...same, holdProgress: 0.3 })).toBeNull();
    expect(
      say(s({ phase: 'pack-complete' }), s({ phase: 'all-collected', queue: ['contact'] })),
    ).toBeNull();
    expect(
      say(s({ phase: 'card-detail' }), s({ phase: 'card-on-stage', stageCardId: 'a' })),
    ).toBeNull();
    expect(
      say(s({ phase: 'revealing' }), s({ phase: 'card-on-stage', stageCardId: 'nope' })),
    ).toBeNull();
    expect(say(s({ phase: 'card-on-stage' }), s({ phase: 'card-detail' }))).toBeNull();
    expect(say(s({ phase: 'box-open' }), s({ phase: 'resetting' }))).toBeNull();
  });

  it('an early release says "not yet"', () => {
    expect(say(s({ phase: 'unwrapping' }), s({ phase: 'sealed', lastHoldCancelledAt: 1 }))).toBe(
      en.hold_not_yet,
    );
    expect(
      say(
        s({ phase: 'pack-tearing', lastHoldCancelledAt: 1 }),
        s({ phase: 'pack-focused', lastHoldCancelledAt: 2 }),
      ),
    ).toBe(en.hold_not_yet);
  });
});
