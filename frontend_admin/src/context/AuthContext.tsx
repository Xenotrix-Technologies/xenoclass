import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  Id: number;
  User_Name?: string;
  First_Name?: string;
  Last_Name?: string;
  Email: string;
  PhoneNumber?: string;
  User_Type_Id: number;
  User_Type_Name?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken =
      localStorage.getItem('admin_token') ||
      localStorage.getItem('Access_Token') ||
      localStorage.getItem('token');
    const savedUser = localStorage.getItem('admin_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('Access_Token');
        localStorage.removeItem('admin_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await authService.login(email, pass);
    // Backend returns { '0': { Id, First_Name, Email, PhoneNumber, User_Type_Id }, token }
    const loggedUser = data[0] || data.user || data;
    const jwtToken = data.token;

    if (jwtToken) {
      localStorage.setItem('admin_token', jwtToken);
      localStorage.setItem('Access_Token', jwtToken);
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('Email', loggedUser.Email || email);
      localStorage.setItem('Name', loggedUser.First_Name || loggedUser.User_Name || 'Admin');
      localStorage.setItem('User_Type', '1');
      localStorage.setItem('admin_user', JSON.stringify(loggedUser));
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
    <AuthContext.Provider
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
