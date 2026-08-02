import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DashboardShell from './DashboardShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/ui/ThemeToggle.jsx', () => ({
  default: () => <div>Theme Toggle</div>,
}));

vi.mock('../components/notifications/NotificationBell.jsx', () => ({
  default: () => <div>Notification Bell</div>,
}));

const navItems = [{ to: '/dashboard', label: 'Overview', end: true }];

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<DashboardShell title="Citizen" navItems={navItems} />}>
          <Route path="/dashboard" element={<div>Overview Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('DashboardShell (responsive layout)', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { name: 'Jane Citizen' }, logout: vi.fn() });
  });

  it('keeps the mobile drawer closed by default', () => {
    renderShell();
    const closeButton = screen.getByRole('button', { name: 'Close menu' });
    expect(closeButton).toHaveAttribute('tabindex', '-1');
  });

  it('opens the mobile drawer when the hamburger button is clicked', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('tabindex', '0');
  });

  it('closes the drawer when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('tabindex', '0');

    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('tabindex', '-1');
  });

  it('closes the drawer when a nav link is clicked', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('tabindex', '0');

    await user.click(screen.getAllByText('Overview')[0]);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('tabindex', '-1');
  });

  it('renders the outlet content and signed-in user', () => {
    renderShell();
    expect(screen.getByText('Overview Content')).toBeInTheDocument();
    expect(screen.getByText('Signed in as Jane Citizen')).toBeInTheDocument();
  });

  it('calls logout when the logout button is clicked', async () => {
    const logout = vi.fn();
    useAuth.mockReturnValue({ user: { name: 'Jane Citizen' }, logout });
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
