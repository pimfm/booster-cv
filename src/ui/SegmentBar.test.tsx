import { LazyMotion, domAnimation } from 'framer-motion';
import { render, screen } from '@testing-library/react';
import { SegmentBar } from './SegmentBar';

const wrap = (ui: React.ReactNode) =>
  render(
    <LazyMotion features={domAnimation} strict>
      {ui}
    </LazyMotion>,
  );

describe('SegmentBar', () => {
  it('is a meter 0–10 named by its visible label', () => {
    const { container } = wrap(<SegmentBar value={7} label="Patience" tint={2} />);
    const meter = screen.getByRole('meter', { name: 'Patience' });
    expect(meter).toHaveAttribute('aria-valuenow', '7');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '10');
    expect(container.querySelectorAll('.segment')).toHaveLength(10);
    expect(container.querySelectorAll('.segment[data-on]')).toHaveLength(7);
    expect(screen.getByText('Patience')).toBeVisible();
  });

  it('clamps and rounds the value', () => {
    wrap(
      <>
        <SegmentBar value={14} label="High" />
        <SegmentBar value={-3} label="Low" showValue={false} />
        <SegmentBar value={4.6} label="Mid" />
      </>,
    );
    expect(screen.getByRole('meter', { name: 'High' })).toHaveAttribute('aria-valuenow', '10');
    expect(screen.getByRole('meter', { name: 'Low' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('meter', { name: 'Mid' })).toHaveAttribute('aria-valuenow', '5');
  });
});
