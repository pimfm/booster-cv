import type { ReactNode } from 'react';

/**
 * Identity wrapper for now. PL-02 fills it in (versioned localStorage, HYDRATE on mount,
 * clear on RESET_DONE, `?fresh` skips hydration) without touching Providers.tsx.
 */
export function PersistenceProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
