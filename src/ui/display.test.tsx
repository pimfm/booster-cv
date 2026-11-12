import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, Chip, Frame, Kbd, PMark, RarityMark, VisuallyHidden } from './index';

describe('display primitives', () => {
  it.each(['common', 'uncommon', 'rare', 'holo'] as const)('RarityMark %s is decorative', (r) => {
    const { container } = render(<RarityMark rarity={r} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('data-rarity', r);
  });

  it('distinguishes the four rarity shapes', () => {
    const count = (r: 'common' | 'uncommon' | 'rare' | 'holo') => {
      const { container, unmount } = render(<RarityMark rarity={r} />);
      const n = container.querySelectorAll('rect, polygon').length;
      unmount();
      return n;
    };
    expect([count('common'), count('uncommon'), count('rare'), count('holo')]).toEqual([1, 2, 1, 3]);
  });

  it('Badge renders text, with an optional rarity mark', () => {
    const { container } = render(
      <>
        <Badge>New</Badge>
        <Badge rarity="rare">Rare</Badge>
      </>,
    );
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(screen.getByText('Rare').closest('[data-rarity]')).toHaveAttribute('data-rarity', 'rare');
  });

  it('Frame renders the requested element with data hooks and forwards refs', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Frame as="section" aria-label="Panel" ref={ref} border={3} shadow={2} tint={4} radius="card">
        x
      </Frame>,
    );
    const el = screen.getByRole('region', { name: 'Panel' });
    expect(el).toBe(ref.current);
    expect(el.tagName).toBe('SECTION');
    expect(el).toHaveAttribute('data-border', '3');
    expect(el).toHaveAttribute('data-shadow', '2');
    expect(el).toHaveAttribute('data-surface', 'tint-4');
    expect(el).toHaveAttribute('data-radius', 'card');
  });

  it('Chip, Kbd, VisuallyHidden and PMark render', () => {
    const { container } = render(
      <>
        <Chip className="c">Kotlin</Chip>
        <Kbd>Esc</Kbd>
        <VisuallyHidden>hidden text</VisuallyHidden>
        <PMark letter="K" />
      </>,
    );
    expect(screen.getByText('Kotlin')).toHaveClass('chip', 'c');
    expect(screen.getByText('Esc').tagName).toBe('KBD');
    expect(screen.getByText('hidden text')).toHaveClass('hidden');
    const mark = container.querySelector('.pmark');
    expect(mark).toHaveTextContent('K');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
  });
});
