import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface StudentUser {
  Id: number;
  Student_ID?: number;
  User_ID?: number;
  Student_Name?: string;
  User_Name?: string;
  Email: string;
  Mobile_Number?: string;
  [key: string]: any;
}

interface StudentAuthContextType {
  user: StudentUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StudentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('student_token');
    const savedUser = localStorage.getItem('student_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await authService.login(email, pass);
    const loggedUser = data[0] || data.user || data;
    const jwtToken = data.token;

    if (jwtToken) {
      localStorage.setItem('student_token', jwtToken);
      localStorage.setItem('student_user', JSON.stringify(loggedUser));
      setToken(jwtToken);
      setUser(loggedUser);
    }
    return data;
  };

  const register = async (data: any) => {
    const res = await authService.registerStudent(data);
    return res;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <StudentAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
};

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
};
