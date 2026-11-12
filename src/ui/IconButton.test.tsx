import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('uses label as the accessible name and forwards refs', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton label="Close" ref={ref}>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    const b = screen.getByRole('button', { name: 'Close' });
    expect(b).toBe(ref.current);
    expect(b).not.toHaveAttribute('aria-pressed');
  });

  it('maps pressed to aria-pressed', () => {
    const { rerender } = render(
      <IconButton label="Sound" pressed={false}>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <IconButton label="Sound" pressed>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Sound', pressed: true })).toBeInTheDocument();
  });

  it('activates from the keyboard and not when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <IconButton label="Close" onClick={onClick}>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
    rerender(
      <IconButton label="Close" onClick={onClick} disabled>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('requires label at the type level', () => {
    // @ts-expect-error — `label` (the aria-label) is required
    const el = <IconButton>x</IconButton>;
    expect(el).toBeTruthy();
  });
});
