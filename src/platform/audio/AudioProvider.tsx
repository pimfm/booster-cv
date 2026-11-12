import type { ReactNode } from 'react';

/**
 * Identity wrapper for now. PL-03 fills it in (opt-in sound, samples triggered from
 * `@/platform/events`) without touching Providers.tsx.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
