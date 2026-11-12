import { createContext, useContext } from 'react';

export type PersistedSound = readonly [sound: boolean, setSound: (on: boolean) => void];

const OFF: PersistedSound = [false, () => {}];

export const PersistedSoundContext = createContext<PersistedSound>(OFF);

/**
 * `const [sound, setSound] = usePersistedSound()` — the opt-in sound choice, stored in the
 * `booster.v1` payload. Default false; outside `<PersistenceProvider>` it is false and
 * `setSound` does nothing.
 */
export function usePersistedSound(): PersistedSound {
  return useContext(PersistedSoundContext);
}
