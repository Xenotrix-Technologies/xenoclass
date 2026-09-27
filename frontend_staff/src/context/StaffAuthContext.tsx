import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface StaffUser {
  Id: number;
  User_ID?: number;
  User_Name: string;
  Email: string;
  User_Type_Id: number;
  [key: string]: any;
}

interface StaffAuthContextType {
  user: StaffUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => void;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('staff_token');
    const savedUser = localStorage.getItem('staff_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await authService.login(email, pass);
    const loggedUser = data[0] || data.user || data;
    const jwtToken = data.token;

    if (jwtToken) {
      localStorage.setItem('staff_token', jwtToken);
      localStorage.setItem('staff_user', JSON.stringify(loggedUser));
      setToken(jwtToken);
      setUser(loggedUser);
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <StaffAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = () => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within StaffAuthProvider');
  }
  return context;
};
