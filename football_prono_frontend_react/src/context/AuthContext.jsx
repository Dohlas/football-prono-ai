/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from "react";
import { apiService } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si un token est déjà présent au chargement de l'application
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Valide le token avec le backend en arrière-plan
          const profile = await apiService.getProfile();
          setUser(profile.user);
          localStorage.setItem("user", JSON.stringify(profile.user));
        } catch (error) {
          console.warn("Session expirée ou invalide :", error.message);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (username, password) => {
    const data = await apiService.login(username, password);
    if (data && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    }
    throw new Error("Réponse d'authentification incorrecte.");
  };

  const register = async (username, password) => {
    const data = await apiService.register(username, password);
    if (data && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    }
    throw new Error("Réponse d'inscription incorrecte.");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
