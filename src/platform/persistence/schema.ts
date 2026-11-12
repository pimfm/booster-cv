/**
 * The persisted payload under `booster.v1` (PL-02). Anything that does not parse is
 * discarded silently: a broken binder is worse than a sealed box.
 */
import { z } from 'zod';

export const STORAGE_KEY = 'booster.v1';
export const PAYLOAD_VERSION = 1;

export const PayloadSchema = z.object({
  v: z.literal(PAYLOAD_VERSION),
  /** `meta.contentVersion` when this was written; a mismatch discards the progress */
  contentVersion: z.number().int(),
  collected: z.array(z.string()),
  openedPacks: z.array(z.string()),
  /** opt-in sound (PL-03); absent = off */
  sound: z.boolean().optional(),
  /** ms since epoch */
  savedAt: z.number(),
});

export type Payload = z.infer<typeof PayloadSchema>;
