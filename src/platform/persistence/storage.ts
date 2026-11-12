/**
 * Pure-ish storage helpers for PL-02. Every access is wrapped: private mode, a full
 * quota or disabled storage make reads return nothing and writes do nothing.
 */
import { cardsInPack } from '@/content/bundle';
import type { ContentBundle } from '@/content/types';
import type { PersistedState } from '@/machine';
import { PAYLOAD_VERSION, PayloadSchema, STORAGE_KEY } from './schema';
import type { Payload } from './schema';

/** The subset of `Storage` we use, so tests can pass a fake. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** `window.localStorage`, or null when even touching it throws. */
export function defaultStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export interface Stored {
  /** null: nothing usable stored (missing, invalid, other contentVersion) */
  progress: PersistedState | null;
  sound: boolean;
}

const NOTHING: Stored = { progress: null, sound: false };

/** Parses a raw value. Card ids are NOT filtered here: HYDRATE drops unknown ids. */
export function parseStored(raw: string | null, contentVersion: number): Stored {
  if (raw === null) return NOTHING;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NOTHING;
  }
  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) return NOTHING;
  const { data } = parsed;
  const sound = data.sound ?? false;
  // other content: the binder may not make sense any more, the sound choice still does
  if (data.contentVersion !== contentVersion) return { progress: null, sound };
  return { progress: { collected: data.collected, openedPacks: data.openedPacks }, sound };
}

export function readStored(storage: StorageLike | null, contentVersion: number): Stored {
  if (storage === null) return NOTHING;
  try {
    return parseStored(storage.getItem(STORAGE_KEY), contentVersion);
  } catch {
    return NOTHING;
  }
}

const EMPTY: PersistedState = { collected: [], openedPacks: [] };

/** Writes progress + sound; an empty binder with sound off removes the key. */
export function writeStored(
  storage: StorageLike | null,
  contentVersion: number,
  progress: PersistedState,
  sound: boolean,
  now: number = Date.now(),
): void {
  if (storage === null) return;
  try {
    if (progress.collected.length === 0 && progress.openedPacks.length === 0 && !sound) {
      storage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: Payload = {
      v: PAYLOAD_VERSION,
      contentVersion,
      collected: [...progress.collected],
      openedPacks: [...progress.openedPacks],
      ...(sound ? { sound } : {}),
      savedAt: now,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode: this visit is not remembered
  }
}

/** Saves the binder, keeping whatever sound choice is stored. */
export function saveProgress(storage: StorageLike | null, contentVersion: number, progress: PersistedState): void {
  writeStored(storage, contentVersion, progress, readStored(storage, contentVersion).sound);
}

/** Clears the binder, keeping the sound choice. */
export function clearProgress(storage: StorageLike | null, contentVersion: number): void {
  saveProgress(storage, contentVersion, EMPTY);
}

/** Saves the sound choice, keeping whatever binder is stored. */
export function saveSound(storage: StorageLike | null, contentVersion: number, sound: boolean): void {
  writeStored(storage, contentVersion, readStored(storage, contentVersion).progress ?? EMPTY, sound);
}

/** Removes everything under `booster.v1` (dev `?fresh`). The locale key is left alone. */
export function clearAll(storage: StorageLike | null): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}

/**
 * Dev `?state=`: `all` → every card (and the contact card) collected, every pack opened;
 * `a,b` → those packs fully collected. Unknown pack ids are ignored; none left → null.
 */
export function devProgress(bundle: ContentBundle, value: string): PersistedState | null {
  const all = value.trim() === 'all';
  const wanted = all ? bundle.packs.map((pack) => pack.id) : value.split(',').map((id) => id.trim());
  const packs = bundle.packs.filter((pack) => wanted.includes(pack.id));
  if (packs.length === 0) return null;
  const collected = packs.flatMap((pack) => cardsInPack(bundle, pack.id).map((card) => card.id));
  if (all) collected.push(bundle.meta.contactCard.id);
  return { collected, openedPacks: packs.map((pack) => pack.id) };
}

export interface Boot {
  /** `?fresh`: storage is cleared on mount, before anything is read back */
  fresh: boolean;
  /** what HYDRATE gets on mount; null → no HYDRATE */
  progress: PersistedState | null;
  sound: boolean;
}

/** What the provider starts from. Reads only; the provider performs the `?fresh` clear. */
export function bootState(
  bundle: ContentBundle,
  storage: StorageLike | null,
  search: string,
  dev: boolean,
): Boot {
  const params = new URLSearchParams(search);
  const fresh = dev && params.has('fresh');
  const stored = fresh ? NOTHING : readStored(storage, bundle.meta.contentVersion);
  const state = dev ? params.get('state') : null;
  const forced = state === null ? null : devProgress(bundle, state);
  return { fresh, progress: forced ?? stored.progress, sound: stored.sound };
}
