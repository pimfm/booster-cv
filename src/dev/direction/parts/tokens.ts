/** Reads token values straight from the direction's CSS source, so the tile never drifts from it. */
export type TokenMap = Map<string, string>;

export function parseTokens(...sources: string[]): TokenMap {
  const map: TokenMap = new Map();
  for (const source of sources) {
    const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const [, name, value] = m;
      if (name && value) map.set(name, value.replace(/\s+/g, ' ').trim());
    }
  }
  return map;
}

/** Follows `var(--x)` references until a literal value is reached. */
export function resolveToken(map: TokenMap, name: string, depth = 0): string {
  const raw = map.get(name) ?? '';
  if (depth > 6) return raw;
  return raw.replace(/var\((--[\w-]+)\)/g, (_, ref: string) => resolveToken(map, ref, depth + 1));
}

function channels(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number | null {
  const rgb = channels(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio of two 6-digit hex colours; 0 when either is not a hex colour. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return 0;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `clamp(1rem, …, 1.5rem)` → `16–24 px`; anything else is returned unchanged. */
export function clampRange(value: string): string {
  const m = /^clamp\(\s*([\d.]+)rem\s*,.*,\s*([\d.]+)rem\s*\)$/.exec(value);
  if (!m?.[1] || !m[2]) return value;
  const px = (rem: string) => Math.round(parseFloat(rem) * 16 * 10) / 10;
  return `${px(m[1])}–${px(m[2])} px`;
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
