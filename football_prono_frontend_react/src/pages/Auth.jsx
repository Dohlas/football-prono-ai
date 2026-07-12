import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Déterminer si on affiche l'inscription par défaut à partir de la query string (?register=true)
  const isRegisterParam = new URLSearchParams(location.search).get("register") === "true";
  const [isRegister, setIsRegister] = useState(isRegisterParam);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Adapter l'état si l'URL change
  useEffect(() => {
    setIsRegister(isRegisterParam);
    setError("");
  }, [isRegisterParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Oups, la connexion a échoué. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative"
    }}>
      {/* Bouton Retour Accueil */}
      <Link to="/" style={{
        position: "absolute",
        top: "30px",
        left: "30px",
        fontFamily: "var(--font-title)",
        fontSize: "12px",
        textTransform: "uppercase",
        color: "var(--text-silver)"
      }}>
        ← Retour au portail public
      </Link>

      <div className="card-tactical" style={{ width: "100%", maxWidth: "420px" }}>
        {/* En-tête technique */}
        <div className="card-header-tech">
          <div className="card-title-tech">
            {isRegister ? "Nouveau Compte Tactique" : "Connexion au Terminal"}
          </div>
          <span style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--text-silver)" }}>
            [SSL: SECURE]
          </span>
        </div>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "8px", fontWeight: 700 }}>
            {isRegister ? "Créer un accès gratuit" : "Entrer vos identifiants"}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-silver)" }}>
            {isRegister 
              ? "Accédez aux rapports quantitatifs IA immédiatement."
              : "Rebranchez-vous sur vos modèles de calculs statistiques."
            }
          </p>
        </div>

        {/* Bloc d'erreur style technique */}
        {error && (
          <div style={{
            backgroundColor: "rgba(255, 59, 48, 0.05)",
            border: "1px solid var(--neon-red)",
            borderRadius: "4px",
            padding: "12px",
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            color: "var(--text-white)",
            fontSize: "12px"
          }}>
            <AlertTriangle size={16} style={{ color: "var(--neon-red)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ color: "var(--neon-red)", display: "block", textTransform: "uppercase", fontSize: "10px", fontFamily: "var(--font-title)" }}>Attention</strong>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{
              display: "block",
              fontFamily: "var(--font-title)",
              fontSize: "11px",
              textTransform: "uppercase",
              color: "var(--text-silver)",
              marginBottom: "6px"
            }}>Adresse e-mail</label>
            <input 
              type="email" 
              className="input-tactical"
              placeholder="ex: nom@domaine.com" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              autoComplete="username"
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontFamily: "var(--font-title)",
              fontSize: "11px",
              textTransform: "uppercase",
              color: "var(--text-silver)",
              marginBottom: "6px"
            }}>Mot de passe</label>
            <input 
              type="password" 
              className="input-tactical"
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>

          {isRegister && (
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-title)",
                fontSize: "11px",
                textTransform: "uppercase",
                color: "var(--text-silver)",
                marginBottom: "6px"
              }}>Confirmer le mot de passe</label>
              <input 
                type="password" 
                className="input-tactical"
                placeholder="••••••••••••" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn-neon" 
            style={{ width: "100%", marginTop: "10px" }}
            disabled={submitting}
          >
            <span className="btn-neon-content">
              {submitting ? "Traitement cryptographique..." : (isRegister ? "Activer l'accès gratuit" : "Entrer dans le terminal")}
            </span>
          </button>
        </form>

        <div style={{
          marginTop: "24px",
          borderTop: "1px solid var(--border-color)",
          paddingTop: "20px",
          textAlign: "center",
          fontSize: "12px"
        }}>
          {isRegister ? (
            <span>
              Déjà membre ?{" "}
              <button 
                onClick={() => setIsRegister(false)}
                style={{ background: "none", border: "none", color: "var(--neon-green)", cursor: "pointer", fontWeight: 600 }}
              >
                Connectez-vous
              </button>
            </span>
          ) : (
            <span>
              Nouveau sur le terminal ?{" "}
              <button 
                onClick={() => setIsRegister(true)}
                style={{ background: "none", border: "none", color: "var(--neon-green)", cursor: "pointer", fontWeight: 600 }}
              >
                Créez un compte gratuit
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
