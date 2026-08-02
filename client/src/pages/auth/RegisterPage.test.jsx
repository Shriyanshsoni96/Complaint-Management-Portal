import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './RegisterPage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillAndSubmit(user, { name, email, phone, password }) {
  if (name !== undefined) await user.type(screen.getByLabelText('Full name'), name);
  if (email !== undefined) await user.type(screen.getByLabelText('Email'), email);
  if (phone !== undefined) await user.type(screen.getByLabelText('Phone'), phone);
  if (password !== undefined) await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the first express-validator error message returned by the API', async () => {
    const register = vi.fn().mockRejectedValue({
      response: { data: { errors: [{ msg: 'Password must be at least 8 characters.' }] } },
    });
    useAuth.mockReturnValue({ register });
    const user = userEvent.setup();
    renderRegisterPage();

    await fillAndSubmit(user, {
      name: 'Jane Citizen',
      email: 'jane@example.com',
      phone: '1234567890',
      password: 'short12',
    });

    expect(
      await screen.findByText('Password must be at least 8 characters.'),
    ).toBeInTheDocument();
  });

  it('falls back to the top-level API message when there are no field errors', async () => {
    const register = vi.fn().mockRejectedValue({
      response: { data: { message: 'An account with this email already exists.' } },
    });
    useAuth.mockReturnValue({ register });
    const user = userEvent.setup();
    renderRegisterPage();

    await fillAndSubmit(user, {
      name: 'Jane Citizen',
      email: 'jane@example.com',
      phone: '1234567890',
      password: 'password123',
    });

    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument();
  });

  it('falls back to a generic error message when the API gives nothing usable', async () => {
    const register = vi.fn().mockRejectedValue(new Error('network down'));
    useAuth.mockReturnValue({ register });
    const user = userEvent.setup();
    renderRegisterPage();

    await fillAndSubmit(user, {
      name: 'Jane Citizen',
      email: 'jane@example.com',
      phone: '1234567890',
      password: 'password123',
    });

    expect(
      await screen.findByText('Registration failed. Please try again.'),
    ).toBeInTheDocument();
  });

  it('enforces the minimum password length via the input constraint', () => {
    useAuth.mockReturnValue({ register: vi.fn() });
    renderRegisterPage();

    expect(screen.getByLabelText('Password')).toHaveAttribute('minLength', '8');
  });

  it('redirects to /login with a success flag after a successful registration', async () => {
    const register = vi.fn().mockResolvedValue({});
    useAuth.mockReturnValue({ register });
    const user = userEvent.setup();
    renderRegisterPage();

    await fillAndSubmit(user, {
      name: 'Jane Citizen',
      email: 'jane@example.com',
      phone: '1234567890',
      password: 'password123',
    });

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(register).toHaveBeenCalledWith({
      name: 'Jane Citizen',
      email: 'jane@example.com',
      password: 'password123',
      phone: '1234567890',
    });
  });

  it('disables the submit button while the request is in flight', async () => {
    let resolveRegister;
    const register = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve;
        }),
    );
    useAuth.mockReturnValue({ register });
    const user = userEvent.setup();
    renderRegisterPage();

    await fillAndSubmit(user, {
      name: 'Jane Citizen',
      email: 'jane@example.com',
      phone: '1234567890',
      password: 'password123',
    });

    expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
    resolveRegister({});
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });
});
