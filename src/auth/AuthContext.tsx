import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedUser = sessionStorage.getItem('user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
      setLoading(false);
    } else {
      fetch('https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/me', {
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setUser(data);
            sessionStorage.setItem('user', JSON.stringify(data));
          }
        })
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
