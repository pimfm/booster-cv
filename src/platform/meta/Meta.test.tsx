import { act, render } from '@testing-library/react';
import en from '@content/strings.en';
import nl from '@content/strings.nl';
import { loc, makeMeta } from '@/content/testkit';
import { LocaleProvider, useLocale } from '@/platform/i18n';
import type { LocaleContextValue } from '@/platform/i18n';
import { Meta } from './Meta';

const meta = makeMeta({
  og: {
    title: loc('Box title', 'Doostitel'),
    description: loc('English description.', 'Nederlandse omschrijving.'),
  },
});

const content = (selector: string) =>
  document.head.querySelector(selector)?.getAttribute('content');

function renderMeta(initial: 'en' | 'nl') {
  let ctx: LocaleContextValue | undefined;
  function Grab() {
    ctx = useLocale();
    return null;
  }
  render(
    <LocaleProvider strings={{ en, nl }} initial={initial}>
      <Meta meta={meta} />
      <Grab />
    </LocaleProvider>,
  );
  return () => ctx!;
}

describe('Meta', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="description" content="static" />';
    document.title = 'static';
  });

  it('writes title, description and OG tags for the initial locale', () => {
    renderMeta('en');
    expect(document.title).toBe('Box title');
    expect(content('meta[name="description"]')).toBe('English description.');
    expect(content('meta[property="og:title"]')).toBe('Box title');
    expect(content('meta[property="og:description"]')).toBe('English description.');
    expect(content('meta[property="og:locale"]')).toBe('en_GB');
    expect(content('meta[property="og:locale:alternate"]')).toBe('nl_NL');
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  });

  it('follows a locale switch', () => {
    const ctx = renderMeta('en');
    act(() => ctx().setLocale('nl'));
    expect(document.title).toBe('Doostitel');
    expect(content('meta[name="description"]')).toBe('Nederlandse omschrijving.');
    expect(content('meta[property="og:locale"]')).toBe('nl_NL');
    expect(content('meta[property="og:locale:alternate"]')).toBe('en_GB');
    expect(content('meta[name="twitter:title"]')).toBe('Doostitel');
  });
});
