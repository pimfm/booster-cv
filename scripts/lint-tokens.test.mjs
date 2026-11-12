import { describe, expect, it } from 'vitest';
import { isScanned, scanText } from './lint-tokens.mjs';

const rules = (file, text) => scanText(file, text).map((f) => f.rule);

describe('lint-tokens scanText', () => {
  it('flags raw hex colours of length 3, 4, 6 and 8', () => {
    const text = 'a { color: #fff; }\nb { color: #ffff; }\nc { color: #a1b2c3; }\nd { color: #a1b2c3d4; }';
    const found = scanText('src/ui/a.css', text);
    expect(found.map((f) => f.line)).toEqual([1, 2, 3, 4]);
    expect(found.every((f) => f.rule === 'raw-hex-colour')).toBe(true);
  });

  it('ignores #root, url fragments, entities and odd-length hex', () => {
    expect(rules('src/ui/a.css', '#root { height: 100%; }')).toEqual([]);
    expect(rules('src/ui/a.tsx', "const a = '#section'; const b = '&#1234;'; const c = '#12345';")).toEqual([]);
  });

  it('flags rgb()/hsl() literals in css and ts', () => {
    expect(rules('src/ui/a.css', 'a { color: rgba(0, 0, 0, 0.5); }')).toEqual(['raw-colour-function']);
    expect(rules('src/ui/a.ts', "const c = 'hsl(10 20% 30%)';")).toEqual(['raw-colour-function']);
  });

  it('flags raw time literals in css only', () => {
    expect(rules('src/ui/a.css', 'a { transition: opacity 200ms; }')).toEqual(['raw-time-literal']);
    expect(rules('src/ui/a.css', 'a { transition: opacity .3s, color 0.25s; }')).toEqual([
      'raw-time-literal',
      'raw-time-literal',
    ]);
    expect(rules('src/ui/a.ts', "const t = '200ms';")).toEqual([]);
  });

  it('accepts tokens, class names with digits, comments and the ignore mark', () => {
    const css = [
      'a { transition: opacity var(--dur-sm) var(--ease-out); color: var(--ink); }',
      '.cols { columns: 2; } .step-2s { margin: var(--s-2); }',
      '/* was 200ms and #fff */',
      'b { color: #fff; } /* lint-tokens-ignore: third-party embed */',
    ].join('\n');
    expect(scanText('src/ui/a.css', css)).toEqual([]);
  });

  it('reports file, line and column', () => {
    expect(scanText('src/ui/a.css', 'a {\n  color: #abc;\n}')).toEqual([
      { file: 'src/ui/a.css', line: 2, column: 10, rule: 'raw-hex-colour', match: '#abc' },
    ]);
  });
});

describe('lint-tokens isScanned', () => {
  it('scans src css/ts/tsx outside src/design and outside tests', () => {
    expect(isScanned('src/ui/Button.module.css')).toBe(true);
    expect(isScanned('src/scene/Box.tsx')).toBe(true);
    expect(isScanned('src/design/tokens.css')).toBe(false);
    expect(isScanned('src/ui/Button.test.tsx')).toBe(false);
    expect(isScanned('scripts/x.ts')).toBe(false);
    expect(isScanned('src/ui/logo.svg')).toBe(false);
  });
});
