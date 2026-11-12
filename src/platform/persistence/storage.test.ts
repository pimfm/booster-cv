import { describe, expect, it } from 'vitest';
import { createBundle } from '@/content/bundle';
import { makeParts } from '@/content/testkit';
import { STORAGE_KEY } from './schema';
import {
  bootState,
  clearProgress,
  devProgress,
  parseStored,
  readStored,
  saveProgress,
  saveSound,
  writeStored,
} from './storage';
import type { StorageLike } from './storage';
import { memoryStorage } from './testStorage';

const bundle = createBundle(makeParts());

const payload = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ v: 1, contentVersion: 1, collected: ['a'], openedPacks: [], savedAt: 1, ...extra });

describe('parseStored', () => {
  it('reads a valid payload', () => {
    expect(parseStored(payload({ sound: true }), 1)).toEqual({
      progress: { collected: ['a'], openedPacks: [] },
      sound: true,
    });
  });

  it.each([
    ['nothing stored', null],
    ['invalid JSON', '{nope'],
    ['wrong v', payload({ v: 2 })],
    ['missing field', JSON.stringify({ v: 1, contentVersion: 1, collected: [] })],
    ['wrong types', payload({ collected: 'a' })],
  ])('%s → nothing (sealed)', (_name, raw) => {
    expect(parseStored(raw, 1)).toEqual({ progress: null, sound: false });
  });

  it('old contentVersion → no progress, the sound choice survives', () => {
    expect(parseStored(payload({ contentVersion: 0, sound: true }), 1)).toEqual({ progress: null, sound: true });
  });

  it('keeps unknown ids (HYDRATE filters them)', () => {
    expect(parseStored(payload({ collected: ['a', 'gone'] }), 1).progress?.collected).toEqual(['a', 'gone']);
  });
});

describe('writing', () => {
  it('round trips', () => {
    const storage = memoryStorage();
    writeStored(storage, 1, { collected: ['a', 'b'], openedPacks: ['one'] }, true, 42);
    expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? '')).toEqual({
      v: 1,
      contentVersion: 1,
      collected: ['a', 'b'],
      openedPacks: ['one'],
      sound: true,
      savedAt: 42,
    });
    expect(readStored(storage, 1)).toEqual({ progress: { collected: ['a', 'b'], openedPacks: ['one'] }, sound: true });
  });

  it('an empty binder with sound off removes the key', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: payload() });
    clearProgress(storage, 1);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it('clearing progress keeps the sound choice, saving sound keeps the binder', () => {
    const storage = memoryStorage();
    saveProgress(storage, 1, { collected: ['a'], openedPacks: [] });
    saveSound(storage, 1, true);
    expect(readStored(storage, 1)).toEqual({ progress: { collected: ['a'], openedPacks: [] }, sound: true });
    clearProgress(storage, 1);
    expect(readStored(storage, 1)).toEqual({ progress: { collected: [], openedPacks: [] }, sound: true });
  });

  it('swallows storage that throws', () => {
    const boom = () => {
      throw new Error('SecurityError');
    };
    const storage: StorageLike = { getItem: boom, setItem: boom, removeItem: boom };
    expect(() => saveProgress(storage, 1, { collected: ['a'], openedPacks: [] })).not.toThrow();
    expect(() => saveSound(storage, 1, true)).not.toThrow();
    expect(readStored(storage, 1)).toEqual({ progress: null, sound: false });
    expect(readStored(null, 1)).toEqual({ progress: null, sound: false });
  });
});

describe('dev helpers', () => {
  it('?state=all → every card plus the contact card, every pack', () => {
    expect(devProgress(bundle, 'all')).toEqual({
      collected: ['a', 'b', 'c', 'd', 'e', 'contact'],
      openedPacks: ['one', 'two'],
    });
  });

  it('?state=<packs> → those packs, unknown ids ignored', () => {
    expect(devProgress(bundle, 'two, nope')).toEqual({ collected: ['d', 'e'], openedPacks: ['two'] });
    expect(devProgress(bundle, 'nope')).toBeNull();
  });

  it('bootState: ?fresh ignores storage; ?state overrides it; neither outside dev', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: payload({ sound: true }) });
    expect(bootState(bundle, storage, '', true)).toEqual({
      fresh: false,
      progress: { collected: ['a'], openedPacks: [] },
      sound: true,
    });
    expect(bootState(bundle, storage, '?fresh', true)).toEqual({ fresh: true, progress: null, sound: false });
    expect(bootState(bundle, storage, '?fresh&state=one', true).progress).toEqual({
      collected: ['a', 'b', 'c'],
      openedPacks: ['one'],
    });
    expect(bootState(bundle, storage, '?fresh&state=all', false)).toEqual({
      fresh: false,
      progress: { collected: ['a'], openedPacks: [] },
      sound: true,
    });
  });
});
