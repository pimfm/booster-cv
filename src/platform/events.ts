/**
 * A tiny typed event bus for one-shot moments (sound, haptics, analytics-free hooks).
 * Scene components `emit`; platform code (audio, PL-03) listens with `on`. State never
 * travels through here: the machine owns state, this only says "it just happened".
 */
export interface BoosterEvents {
  /** a hold crossed one of `hold.thresholdHaptic` (linear progress) */
  'hold:mark': { mark: number; target: 'box' | 'pack' };
  'box:open': undefined;
  'pack:tear': { packId: string };
  'card:draw': { cardId: string };
  /** a rare or holo card landed on the stage */
  'card:rare': { cardId: string };
  'card:collected': { cardId: string };
  'pack:complete': { packId: string };
  'all:collected': undefined;
}

export type BoosterEventName = keyof BoosterEvents;
export type Listener<K extends BoosterEventName> = (detail: BoosterEvents[K]) => void;
type EmitArgs<K extends BoosterEventName> = undefined extends BoosterEvents[K]
  ? [detail?: BoosterEvents[K]]
  : [detail: BoosterEvents[K]];

export const EVENT_NAMES = [
  'hold:mark',
  'box:open',
  'pack:tear',
  'card:draw',
  'card:rare',
  'card:collected',
  'pack:complete',
  'all:collected',
] as const satisfies readonly BoosterEventName[];

export interface EventBus {
  emit<K extends BoosterEventName>(name: K, ...args: EmitArgs<K>): void;
  /** returns the unsubscribe function */
  on<K extends BoosterEventName>(name: K, listener: Listener<K>): () => void;
}

export function createEventBus(): EventBus {
  const listeners = new Map<BoosterEventName, Set<(detail: never) => void>>();
  return {
    emit(name, ...args) {
      const set = listeners.get(name);
      if (!set) return;
      // copy: a listener may unsubscribe (or subscribe) while we iterate
      for (const listener of [...set]) (listener as (detail: unknown) => void)(args[0]);
    },
    on(name, listener) {
      let set = listeners.get(name);
      if (!set) {
        set = new Set();
        listeners.set(name, set);
      }
      set.add(listener);
      return () => {
        set.delete(listener);
      };
    },
  };
}

/** The app-wide bus. */
export const events: EventBus = createEventBus();
export const emit: EventBus['emit'] = events.emit;
export const on: EventBus['on'] = events.on;
