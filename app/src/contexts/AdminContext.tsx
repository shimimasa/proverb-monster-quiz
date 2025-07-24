import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AdminUser } from '../types/admin';
import { AdminManager } from '../core/AdminManager';

interface AdminContextType {
  admin: AdminUser;
  adminManager: AdminManager;
  login: (password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [adminManager] = useState(() => new AdminManager());
  const [admin, setAdmin] = useState<AdminUser>({
    isAuthenticated: false
  });

  const login = useCallback((password: string): boolean => {
    const isValid = adminManager.authenticate(password);
    if (isValid) {
      setAdmin({
        isAuthenticated: true,
        lastLoginAt: new Date()
      });
    }
    return isValid;
  }, [adminManager]);

  const logout = useCallback(() => {
    setAdmin({
      isAuthenticated: false
    });
  }, []);

  const value = {
    admin,
    adminManager,
    login,
    logout,
    isAdmin: admin.isAuthenticated
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};