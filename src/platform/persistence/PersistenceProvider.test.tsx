import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBundle } from '@/content/bundle';
import { makeParts } from '@/content/testkit';
import { ExperienceProvider, useExperience } from '@/machine';
import type { Action } from '@/machine';
import { PersistenceProvider, WRITE_DEBOUNCE_MS } from './PersistenceProvider';
import { STORAGE_KEY } from './schema';
import { usePersistedSound } from './sound';
import type { StorageLike } from './storage';
import { memoryStorage } from './testStorage';

const bundle = createBundle(makeParts());

const BUTTONS: Record<string, Action> = {
  tear: { type: 'TEAR_COMPLETE' },
  focus: { type: 'FOCUS_PACK', packId: 'one' },
  draw: { type: 'DRAW_CARD' },
  collect: { type: 'COLLECT_CARD' },
  reset: { type: 'RESET' },
  done: { type: 'RESET_DONE' },
};

function Probe() {
  const { state, dispatch } = useExperience();
  const [sound, setSound] = usePersistedSound();
  return (
    <div>
      <output data-testid="phase">{state.phase}</output>
      <output data-testid="collected">{state.collected.join(',')}</output>
      <output data-testid="opened">{state.openedPacks.join(',')}</output>
      <output data-testid="sound">{String(sound)}</output>
      <button type="button" onClick={() => setSound(!sound)}>
        sound
      </button>
      {Object.entries(BUTTONS).map(([name, action]) => (
        <button key={name} type="button" onClick={() => dispatch(action)}>
          {name}
        </button>
      ))}
    </div>
  );
}

function mount(storage: StorageLike | null) {
  return render(
    <ExperienceProvider bundle={bundle}>
      <PersistenceProvider storage={storage}>
        <Probe />
      </PersistenceProvider>
    </ExperienceProvider>,
  );
}

const text = (id: string) => screen.getByTestId(id).textContent;
const press = (...names: string[]) => {
  for (const name of names) fireEvent.click(screen.getByRole('button', { name }));
};
const stored = (storage: { data: Map<string, string> }) =>
  JSON.parse(storage.data.get(STORAGE_KEY) ?? 'null') as Record<string, unknown> | null;
const seed = (extra: Record<string, unknown> = {}) => ({
  [STORAGE_KEY]: JSON.stringify({ v: 1, contentVersion: 1, collected: ['a'], openedPacks: [], savedAt: 1, ...extra }),
});
const elapse = (ms = WRITE_DEBOUNCE_MS) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('PersistenceProvider', () => {
  it('hydrates on mount → box-open with the stored binder', () => {
    mount(memoryStorage(seed()));
    expect(text('phase')).toBe('box-open');
    expect(text('collected')).toBe('a');
  });

  it('does not write before hydrate: a pre-seeded binder stays intact', () => {
    const storage = memoryStorage(seed({ collected: ['a', 'b', 'c'], openedPacks: ['one'] }));
    const before = storage.data.get(STORAGE_KEY);
    const setItem = vi.spyOn(storage, 'setItem');
    mount(storage);
    expect(storage.data.get(STORAGE_KEY)).toBe(before);
    elapse(1_000);
    // hydrating the same binder writes nothing new apart from savedAt
    expect(stored(storage)).toMatchObject({ collected: ['a', 'b', 'c'], openedPacks: ['one'] });
    expect(setItem.mock.calls.every(([, value]) => !value.includes('"collected":[]'))).toBe(true);
    expect(text('opened')).toBe('one');
  });

  it('nothing stored: stays sealed and writes nothing', () => {
    const storage = memoryStorage();
    const setItem = vi.spyOn(storage, 'setItem');
    mount(storage);
    elapse(1_000);
    expect(text('phase')).toBe('sealed');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('writes the binder debounced, then round trips through a remount', () => {
    const storage = memoryStorage();
    const view = mount(storage);
    press('tear', 'focus', 'tear', 'draw', 'collect', 'draw', 'collect');
    expect(text('collected')).toBe('a,b');
    elapse(WRITE_DEBOUNCE_MS - 1);
    expect(stored(storage)).toBeNull();
    elapse(1);
    expect(stored(storage)).toMatchObject({ v: 1, contentVersion: 1, collected: ['a', 'b'], openedPacks: [] });
    view.unmount();
    mount(storage);
    expect(text('phase')).toBe('box-open');
    expect(text('collected')).toBe('a,b');
  });

  it('flushes a pending write on unmount', () => {
    const storage = memoryStorage();
    const view = mount(storage);
    press('tear', 'focus', 'tear', 'draw', 'collect');
    view.unmount();
    expect(stored(storage)).toMatchObject({ collected: ['a'] });
  });

  it('a reset clears the binder at once and keeps the sound choice', () => {
    const storage = memoryStorage(seed({ sound: true }));
    mount(storage);
    expect(text('sound')).toBe('true');
    press('reset');
    expect(stored(storage)).toMatchObject({ collected: [], openedPacks: [], sound: true });
    press('done');
    elapse();
    expect(text('phase')).toBe('sealed');
    expect(stored(storage)).toMatchObject({ collected: [], sound: true });
  });

  it('a reset without sound removes the key', () => {
    const storage = memoryStorage(seed());
    mount(storage);
    press('reset', 'done');
    elapse();
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it('old contentVersion → sealed, discarded', () => {
    mount(memoryStorage(seed({ contentVersion: 0, collected: ['a', 'b'] })));
    expect(text('phase')).toBe('sealed');
    expect(text('collected')).toBe('');
  });

  it.each([
    ['invalid JSON', '{oops'],
    ['wrong v', JSON.stringify({ v: 2, contentVersion: 1, collected: ['a'], openedPacks: [], savedAt: 1 })],
  ])('%s → sealed', (_name, raw) => {
    mount(memoryStorage({ [STORAGE_KEY]: raw }));
    expect(text('phase')).toBe('sealed');
  });

  it('unknown ids are filtered; a pack left partial is marked unopened', () => {
    const storage = memoryStorage(seed({ collected: ['a', 'gone', 'd', 'e'], openedPacks: ['one', 'two'] }));
    mount(storage);
    expect(text('collected')).toBe('a,d,e');
    expect(text('opened')).toBe('two');
    elapse();
    expect(stored(storage)).toMatchObject({ collected: ['a', 'd', 'e'], openedPacks: ['two'] });
  });

  it('usePersistedSound: default false, persisted in the same payload', () => {
    const storage = memoryStorage();
    const view = mount(storage);
    expect(text('sound')).toBe('false');
    press('sound');
    expect(text('sound')).toBe('true');
    expect(stored(storage)).toMatchObject({ v: 1, collected: [], sound: true });
    view.unmount();
    mount(storage);
    expect(text('sound')).toBe('true');
    expect(text('phase')).toBe('sealed');
  });

  it('works without storage, and with storage that throws', () => {
    const boom = () => {
      throw new Error('QuotaExceededError');
    };
    for (const storage of [null, { getItem: boom, setItem: boom, removeItem: boom }]) {
      const view = mount(storage);
      press('tear', 'focus', 'tear', 'draw', 'collect', 'sound');
      elapse();
      expect(text('collected')).toBe('a');
      expect(text('sound')).toBe('true');
      view.unmount();
    }
  });
});

describe('PersistenceProvider dev query helpers', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('?fresh clears booster.v1 (not the locale) and drops itself from the URL', () => {
    window.history.replaceState(null, '', '/?fresh&lang=nl');
    const storage = memoryStorage({ ...seed(), 'booster.locale': 'nl' });
    mount(storage);
    expect(text('phase')).toBe('sealed');
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
    expect(storage.data.get('booster.locale')).toBe('nl');
    expect(window.location.search).toBe('?lang=nl');
  });

  it('?state=all hydrates a complete binder', () => {
    window.history.replaceState(null, '', '/?state=all');
    mount(memoryStorage());
    expect(text('phase')).toBe('all-collected');
    expect(text('collected')).toBe('a,b,c,d,e,contact');
  });

  it('?state=<packId> hydrates that pack', () => {
    window.history.replaceState(null, '', '/?state=two');
    mount(memoryStorage(seed()));
    expect(text('phase')).toBe('box-open');
    expect(text('opened')).toBe('two');
  });
});
