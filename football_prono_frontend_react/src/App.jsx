import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import "./App.css";

// Composant de route privée protégée par JWT
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-obsidian)",
        color: "var(--text-silver)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-title)",
        fontSize: "14px"
      }}>
        Initialisation de la liaison sécurisée...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Routes privées protégées */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report/:id" 
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            } 
          />

          {/* Fallback vers l'accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
