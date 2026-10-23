import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

const DEFAULT_USERS = {
  manager: {
    id: "usr-01",
    email: "manager@veridairy.com",
    name: "Eleanor Vance",
    role: "Manager",
    title: "Operations & Dairy Plant Manager",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    badgeId: "MGR-0042",
    department: "Plant Production Leadership"
  },
  supervisor: {
    id: "usr-02",
    email: "supervisor@veridairy.com",
    name: "Marcus Thorne",
    role: "Supervisor",
    title: "Floor Quality & Packaging Supervisor",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    badgeId: "SUP-0118",
    department: "Packaging & QA Assurance"
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('veridairy_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Default to Manager for immediate ready-to-test experience
    return DEFAULT_USERS.manager;
  });

  const [token, setToken] = useState(() => localStorage.getItem('veridairy_auth_token') || 'usr-01');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('veridairy_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('veridairy_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('veridairy_auth_token', token);
    } else {
      localStorage.removeItem('veridairy_auth_token');
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      setCurrentUser(res.user);
      setToken(res.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('veridairy_auth_token');
    localStorage.removeItem('veridairy_current_user');
  };

  const switchPresetRole = (roleKey) => {
    const target = DEFAULT_USERS[roleKey];
    if (target) {
      setCurrentUser(target);
      setToken(target.id);
    }
  };

  const isManager = currentUser?.role === 'Manager';
  const isSupervisor = currentUser?.role === 'Supervisor';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        login,
        logout,
        switchPresetRole,
        isManager,
        isSupervisor,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
