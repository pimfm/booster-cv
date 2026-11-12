import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders a button with its label, variant and size', () => {
    render(
      <Button variant="secondary" size="sm" className="extra">
        Reset
      </Button>,
    );
    const b = screen.getByRole('button', { name: 'Reset' });
    expect(b).toHaveAttribute('type', 'button');
    expect(b).toHaveClass('button', 'secondary', 'sm', 'extra');
  });

  it('activates with click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Open</Button>);
    await user.click(screen.getByRole('button'));
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('is not clickable when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Open
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('keeps the kbd hint out of the accessible name and forwards refs', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} kbd="Space" leadingIcon={<svg data-testid="icon" />}>
        Hold
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Hold' })).toBe(ref.current);
    expect(screen.getByText('Space').tagName).toBe('KBD');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
