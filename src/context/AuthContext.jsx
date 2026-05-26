import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicializar estado desde localStorage al montar la app
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Función para iniciar sesión
  const login = async (username, password) => {
    try {
      const response = await API.post('/auth/login', { username, password });
      const { token, user: loggedUser } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión con el servidor.' };
    }
  };

  // Función para registrar usuario
  const register = async (username, password, nombre, rol) => {
    try {
      const response = await API.post('/auth/register', { username, password, nombre, rol });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión con el servidor.' };
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
