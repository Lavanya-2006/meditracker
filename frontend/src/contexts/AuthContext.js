import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('meditracker_token'));

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('meditracker_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setToken(storedToken);
    } catch {
      localStorage.removeItem('meditracker_token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('meditracker_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('meditracker_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('meditracker_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const updateTheme = async (theme) => {
    try {
      await api.put('/auth/preferences', { theme, notifications: user?.preferences?.notifications ?? true });
      setUser(prev => ({ ...prev, preferences: { ...prev.preferences, theme } }));
      document.documentElement.setAttribute('data-theme', theme);
    } catch {}
  };

  // Apply theme on load
  useEffect(() => {
    const theme = user?.preferences?.theme || localStorage.getItem('meditracker_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, updateTheme, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
