import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('hg_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        fetchNotifications();
      } else {
        logout();
      }
    } catch (err) {
      console.warn('[AuthContext] Session expired or invalid:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      // Quiet fail for notifications
    }
  };

  useEffect(() => {
    fetchProfile();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const login = async (identifier, password) => {
    const res = await api.login({ identifier, password });
    if (res.success && res.token) {
      localStorage.setItem('hg_token', res.token);
      setUser(res.user);
      fetchNotifications();
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore
    } finally {
      localStorage.removeItem('hg_token');
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: fetchProfile,
        notifications,
        unreadCount,
        markAllRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
