import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/authService.js';
import { TOKEN_KEY } from '../constants/storageKeys.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return;
    }

    authService
      .getCurrentUser()
      .then((result) => setUser(result.data.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    localStorage.setItem(TOKEN_KEY, result.data.token);
    setUser(result.data.user);
    return result.data.user;
  }, []);

  const register = useCallback(async (payload) => authService.register(payload), []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // token may already be invalid/expired; proceed with local logout regardless
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
