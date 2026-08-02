import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/ToastContext.jsx', () => ({
  useToast: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/citizen/dashboard" element={<div>Citizen Dashboard</div>} />
        <Route path="/officer/dashboard" element={<div>Officer Dashboard</div>} />
        <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  const showToast = vi.fn();

  beforeEach(() => {
    showToast.mockClear();
    useToast.mockReturnValue({ showToast });
  });

  it('shows the API error message when login fails', async () => {
    const login = vi.fn().mockRejectedValue({
      response: { data: { message: 'Invalid email or password.' } },
    });
    useAuth.mockReturnValue({ login });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Email'), 'citizen@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('falls back to a generic error message when the API gives no message', async () => {
    const login = vi.fn().mockRejectedValue(new Error('network down'));
    useAuth.mockReturnValue({ login });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Email'), 'citizen@example.com');
    await user.type(screen.getByLabelText('Password'), 'whatever123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Login failed. Please try again.')).toBeInTheDocument();
  });

  it('navigates a citizen to the citizen dashboard on successful login', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'citizen' });
    useAuth.mockReturnValue({ login });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Email'), 'citizen@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Citizen Dashboard')).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('Login successful.', { type: 'success' });
  });

  it('navigates an officer to the officer dashboard on successful login', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'officer' });
    useAuth.mockReturnValue({ login });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Email'), 'officer@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Officer Dashboard')).toBeInTheDocument();
  });

  it('navigates an admin to the admin dashboard on successful login', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'admin' });
    useAuth.mockReturnValue({ login });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('disables the submit button while the request is in flight', async () => {
    let resolveLogin;
    const login = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );
    useAuth.mockReturnValue({ login });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Email'), 'citizen@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();

    resolveLogin({ role: 'citizen' });
    await waitFor(() => expect(screen.queryByText('Citizen Dashboard')).toBeInTheDocument());
  });
});
