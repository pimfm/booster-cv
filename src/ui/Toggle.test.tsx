import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './Toggle';

function Controlled() {
  const [on, setOn] = useState(false);
  return <Toggle checked={on} onCheckedChange={setOn} label="Sound" />;
}

describe('Toggle', () => {
  it('is a switch named by its visible label', () => {
    render(<Toggle checked label="Sound" />);
    const sw = screen.getByRole('switch', { name: 'Sound' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles with click, Space and Enter (controlled)', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const sw = screen.getByRole('switch', { name: 'Sound' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await user.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await user.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await user.keyboard('{Enter}');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByText('Sound'));
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('does nothing when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} onCheckedChange={onChange} label="Sound" disabled />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
