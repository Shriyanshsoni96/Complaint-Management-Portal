import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute (navigation)', () => {
  it('renders nothing while auth is still loading', () => {
    useAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: true });
    const { container } = renderWithRoute();
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to /login when the user is not authenticated', () => {
    useAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false });
    renderWithRoute();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to /unauthorized when the role is not allowed', () => {
    useAuth.mockReturnValue({ user: { role: 'citizen' }, isAuthenticated: true, loading: false });
    renderWithRoute();
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  it('renders the protected content for an authenticated, allowed role', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' }, isAuthenticated: true, loading: false });
    renderWithRoute();
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
