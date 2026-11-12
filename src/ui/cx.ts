/** Joins class names, dropping falsy parts. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Props for lucide icons so they match the kit: 2 px stroke, square caps (DESIGN-BRIEF §1). */
export const iconProps = {
  size: 20,
  strokeWidth: 2,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': true,
} as const;

/**
 * Static showcase states for `/dev/kit` and screenshots: pass `data-state="hover"` (etc.)
 * to Button, IconButton, Toggle or SegmentedToggle to freeze that look.
 */
export type StaticState = 'hover' | 'active' | 'focus';
