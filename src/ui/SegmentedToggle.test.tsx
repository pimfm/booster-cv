import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedToggle } from './SegmentedToggle';

const options = [
  { value: 'en', label: 'EN', lang: 'en' },
  { value: 'nl', label: 'NL', lang: 'nl' },
] as const;

function Controlled({ onChange }: { onChange: (v: string) => void }) {
  const [v, setV] = useState<'en' | 'nl'>('en');
  return (
    <SegmentedToggle
      label="Language"
      options={options}
      value={v}
      onValueChange={(next) => {
        onChange(next);
        setV(next);
      }}
    />
  );
}

describe('SegmentedToggle', () => {
  it('renders a labelled group of aria-pressed buttons', () => {
    render(<SegmentedToggle label="Language" options={options} value="nl" />);
    const group = screen.getByRole('group', { name: 'Language' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'NL' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches with the keyboard; pressing the current option is a no-op', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    await user.tab();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith('nl');
    expect(screen.getByRole('button', { name: 'NL' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
  });
});
