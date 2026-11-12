/** The announcer: anything may `announce(text)`; `<LiveRegion/>` speaks the latest message. */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface Announcement {
  text: string;
  /** increases with every announce, so repeating the same text is announced again */
  id: number;
}

export interface Announcer {
  announce: (text: string) => void;
}

const AnnouncerContext = createContext<Announcer | null>(null);
const AnnouncementContext = createContext<Announcement | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<Announcement | null>(null);
  const announce = useCallback((text: string) => {
    setMessage((prev) => ({ text, id: (prev?.id ?? 0) + 1 }));
  }, []);
  const announcer = useMemo<Announcer>(() => ({ announce }), [announce]);
  return (
    <AnnouncerContext.Provider value={announcer}>
      <AnnouncementContext.Provider value={message}>{children}</AnnouncementContext.Provider>
    </AnnouncerContext.Provider>
  );
}

/** `const { announce } = useAnnouncer()` — stable; calling it never re-renders the caller. */
export function useAnnouncer(): Announcer {
  const announcer = useContext(AnnouncerContext);
  if (announcer === null)
    throw new Error('useAnnouncer() must be used inside <AnnouncerProvider>.');
  return announcer;
}

/** The latest message (for LiveRegion). */
export function useAnnouncement(): Announcement | null {
  return useContext(AnnouncementContext);
}
