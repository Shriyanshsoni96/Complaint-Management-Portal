import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal.jsx';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()} title="Confirm">
        Body content
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title and children when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="Confirm delete">
        Are you sure?
      </Modal>,
    );
    expect(screen.getByText('Confirm delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onClose when the Escape key is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open onClose={onClose} title="Confirm">
        Body content
      </Modal>,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open onClose={onClose} title="Confirm">
        Body content
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not react to Escape once closed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <Modal open onClose={onClose} title="Confirm">
        Body content
      </Modal>,
    );
    rerender(
      <Modal open={false} onClose={onClose} title="Confirm">
        Body content
      </Modal>,
    );

    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });
});
