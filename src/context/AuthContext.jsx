import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on page reload
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (!storedToken || !storedUser) {
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser.expiresAt && Date.now() > parsedUser.expiresAt) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setUser(parsedUser);
      setLoading(false);

      if (parsedUser.expiresAt) {
        const remainingTime = parsedUser.expiresAt - Date.now();
        const timer = setTimeout(() => {
          alert('Your session has expired. Please log in again.');
          logout();
        }, Math.max(remainingTime, 0));
        return () => clearTimeout(timer);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const login = (authResponse) => {
    const userData = {
      username: authResponse.username,
      role: authResponse.role,
      expiresAt: authResponse.expiresAt,
    };
    localStorage.setItem('auth_token', authResponse.token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setToken(authResponse.token);
    setUser(userData);
    
    // Set auto-logout timer
    const remainingTime = authResponse.expiresAt - Date.now();
    setTimeout(() => {
      alert('Your session has expired. Please log in again.');
      logout();
    }, remainingTime);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => !!token;
  const isAdmin = () => user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
