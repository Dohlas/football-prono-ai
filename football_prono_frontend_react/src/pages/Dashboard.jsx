import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2, FileText, Zap, Search, AlertTriangle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import TeamLogo from "../components/TeamLogo";
import Loader from "../components/Loader";

// Matchs populaires du jour pré-configurés pour le 1-clic (Jakob's Law / Friction reduction)
const HOT_MATCHES = [
  {
    id: 1,
    home: "France",
    away: "Italie",
    league: "UEFA Nations League",
    url: "https://www.365scores.com/fr/football/match/france-italy-467-331045", // URL de structure type valide
    logoHome: "🇫🇷",
    logoAway: "🇮🇹"
  },
  {
    id: 2,
    home: "Espagne",
    away: "Allemagne",
    league: "Euro Cup",
    url: "https://www.365scores.com/fr/football/match/spain-germany-330950",
    logoHome: "🇪🇸",
    logoAway: "🇩🇪"
  },
  {
    id: 3,
    home: "Real Madrid",
    away: "FC Barcelone",
    league: "LaLiga",
    url: "https://www.365scores.com/fr/football/match/real-madrid-barcelona-12345",
    logoHome: "⚪",
    logoAway: "🔵"
  }
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [matchUrl, setMatchUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const [realTimeLogs, setRealTimeLogs] = useState([]);

  // Charger l'historique au montage
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await apiService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error("Erreur historique :", err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAnalyze = async (urlToAnalyze) => {
    const targetUrl = urlToAnalyze || matchUrl;
    setError("");

    if (!targetUrl) {
      setError("Collez un lien de match 365Scores pour démarrer l'analyse.");
      return;
    }

    if (!targetUrl.includes("365scores.com")) {
      setError("Ce lien ne provient pas de 365Scores. Vérifiez l'adresse et réessayez.");
      return;
    }

    setLoading(true);
    setRealTimeLogs([]);

    try {
      await apiService.analyzeMatchStream(
        targetUrl,
        (progress) => {
          setRealTimeLogs(prev => {
            const filtered = prev.filter(log => log.step !== progress.step);
            const updated = filtered.map(log => ({ ...log, done: true }));
            return [...updated, { step: progress.step, text: progress.message, done: false }];
          });
        },
        (result) => {
          navigate(`/report/${result.id}`, { state: { prediction: result } });
        },
        (err) => {
          setError(err.message || "Oups, une erreur est survenue. Réessayez.");
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err.message || "Oups, une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation(); // Éviter de cliquer sur la carte historique
    if (window.confirm("Voulez-vous supprimer cette analyse de votre historique ?")) {
      try {
        await apiService.deleteHistoryItem(id);
        setHistory(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        alert("Impossible de supprimer : " + err.message);
      }
    }
  };

  const handleHistoryClick = (item) => {
    navigate(`/report/${item.id}`, { state: { prediction: item } });
  };

  if (loading) {
    return <Loader logs={realTimeLogs} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER DE COMMANDE */}
      <header style={{
        borderBottom: "1px solid var(--border-color)",
        backgroundColor: "rgba(18, 22, 32, 0.9)"
      }}>
        <div className="container flex-between" style={{ height: "65px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <img 
              src="/logo.png" 
              alt="Football Prono AI Logo" 
              style={{
                width: "22px",
                height: "22px",
                objectFit: "contain",
                filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))"
              }}
            />
            <span style={{ fontFamily: "var(--font-title)", fontWeight: 700, fontSize: "16px", color: "var(--text-white)" }}>
              TACTICAL TERMINAL
            </span>
            <span style={{
              fontSize: "10px",
              padding: "var(--space-xs) var(--space-sm)",
              border: "1px solid rgba(204, 255, 0, 0.25)",
              borderRadius: "3px",
              color: "var(--neon-green)",
              backgroundColor: "rgba(204, 255, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)"
            }}>
              <span className="status-dot-active" style={{ width: "5px", height: "5px", backgroundColor: "var(--neon-green)", borderRadius: "50%" }}></span>
              TERMINAL ACTIF : {user?.username}
            </span>
          </div>
          <button onClick={logout} className="btn-outline" style={{ padding: "var(--space-xs) var(--space-md)", fontSize: "11px", height: "35px" }}>
            <LogOut size={12} /> Déconnexion
          </button>
        </div>
      </header>

      {/* DASHBOARD PRINCIPAL */}
      <main className="container" style={{ padding: "var(--pr-space-40) var(--space-lg)", flex: 1 }}>
        
        {/* TITRE DE BIENVENUE */}
        <div style={{ marginBottom: "var(--space-xl)" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "var(--space-sm)" }}>Interface d'Arbitrage Quantitatif</h1>
          <p style={{ color: "var(--text-silver)" }}>
            Saisissez de nouvelles données brutes via URL ou exploitez les analyses pré-ciblées du jour.
          </p>
        </div>

        {/* COMPOSANT D'ERREUR */}
        {error && (
          <div style={{
            backgroundColor: "rgba(255, 59, 48, 0.05)",
            border: "1px solid var(--neon-red)",
            borderRadius: "4px",
            padding: "var(--space-md)",
            marginBottom: "var(--space-xl)",
            display: "flex",
            gap: "var(--space-ms)",
            alignItems: "center",
            color: "var(--text-white)"
          }}>
            <AlertTriangle size={18} style={{ color: "var(--neon-red)" }} />
            <div>
              <span style={{ display: "block", fontFamily: "var(--font-title)", fontSize: "11px", fontWeight: 700, color: "var(--neon-red)", textTransform: "uppercase" }}>Attention</span>
              {error}
            </div>
          </div>
        )}

        <div className="grid-dashboard">
          {/* COLONNE GAUCHE : ZONE DE SAISIE ET MATCHS CHAUDS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
            
            {/* SAISIE URL */}
            <div className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Lancement par URL</div>
                <a 
                  href="https://www.365scores.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-title)",
                    textTransform: "uppercase",
                    backgroundColor: "#000000",
                    color: "var(--neon-green)",
                    border: "1px solid var(--neon-green)",
                    padding: "var(--space-xs) var(--space-sm)",
                    borderRadius: "4px",
                    boxShadow: "0 0 8px rgba(34, 197, 94, 0.25)",
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                    textDecoration: "none",
                    transition: "all 0.2s ease-in-out",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(34, 197, 94, 0.5)";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 8px rgba(34, 197, 94, 0.25)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Source: 365Scores
                </a>
              </div>
              <p style={{ fontSize: "13px", marginBottom: "var(--space-md)" }}>
                Collez l'URL d'un match 365Scores. On agrège instantanément les stats de forme et on génère votre modélisation quantitative — sans biais, sans émotion.
              </p>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <input 
                  type="text"
                  className="input-tactical"
                  placeholder="https://www.365scores.com/fr/football/match/..."
                  value={matchUrl}
                  onChange={(e) => setMatchUrl(e.target.value)}
                />
                <button 
                  onClick={() => handleAnalyze()}
                  className="btn-neon"
                  style={{ whiteSpace: "nowrap" }}
                  disabled={!matchUrl.trim()}
                >
                  <Search size={14} /> Analyser
                </button>
              </div>
            </div>

            {/* MATCHS DU JOUR */}
            <div className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Analyses Prêtes en 1 Clic (Matchs Chauds)</div>
                <span style={{ fontSize: "10px", color: "var(--neon-green)" }}>[IA PRÊTE]</span>
              </div>
              <p style={{ fontSize: "13px", marginBottom: "var(--layout-gap-grid)" }}>
                Éliminez la friction de recherche. Lancez directement une simulation sur ces affiches majeures pré-vérifiées.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-ms)" }}>
                {HOT_MATCHES.map(match => (
                  <div 
                    key={match.id}
                    onClick={() => handleAnalyze(match.url)}
                    className="double-bezel-outer double-bezel-outer-interactive"
                    style={{ padding: "4px" }}
                  >
                    <div
                      className="double-bezel-inner"
                      style={{
                        padding: "var(--space-md)",
                        backgroundColor: "var(--bg-obsidian)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px dashed var(--border-color)",
                        borderRadius: "12px"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "10px", color: "var(--text-silver)", textTransform: "uppercase", display: "block" }}>
                          {match.league}
                        </span>
                        <strong style={{ fontSize: "15px", color: "var(--text-white)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                          <TeamLogo teamName={match.home} size={20} />
                          {match.home} <span style={{ color: "var(--text-silver)", fontSize: "12px", fontWeight: "normal" }}>vs</span> {match.away}
                          <TeamLogo teamName={match.away} size={20} />
                        </strong>
                      </div>
                      <span style={{
                        color: "var(--neon-green)",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-xs)"
                      }}>
                        LANCER <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLONNE DROITE : HISTORIQUE DES RAPPORTS */}
          <div className="card-tactical" style={{ display: "flex", flexDirection: "column" }}>
            <div className="card-header-tech">
              <div className="card-title-tech">Historique des Analyses</div>
              <span style={{ fontSize: "10px", color: "var(--text-silver)" }}>
                [{history.length} ENREGISTRÉS]
              </span>
            </div>

            {loadingHistory ? (
              <div style={{ textAlign: "center", padding: "var(--space-xxl) 0", color: "var(--text-silver)" }}>
                Chargement de la base historique...
              </div>
            ) : history.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "var(--space-3xl) var(--layout-gap-grid)",
                border: "1px dashed var(--border-color)",
                borderRadius: "4px",
                color: "var(--text-silver)"
              }}>
                <FileText size={32} style={{ opacity: 0.3, marginBottom: "var(--space-ms)" }} />
                <p style={{ fontSize: "13px" }}>Aucune analyse dans l'historique.</p>
                <p style={{ fontSize: "11px", opacity: 0.7 }}>Vos simulations s'afficheront ici.</p>
              </div>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-ms)",
                overflowY: "auto",
                maxHeight: "450px",
                paddingRight: "var(--space-xs)"
              }}>
                {history.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    className="card-tactical card-tactical-interactive"
                    style={{
                      padding: "var(--space-md)",
                      backgroundColor: "var(--bg-obsidian)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ maxWidth: "80%" }}>
                      <span style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-xs)",
                        fontSize: "9px",
                        textTransform: "uppercase",
                        color: item.prediction_json.niveau_de_confiance === "eleve" ? "var(--neon-green)" : "var(--text-silver)"
                      }}>
                        <Zap size={10} fill={item.prediction_json.niveau_de_confiance === "eleve" ? "var(--neon-green)" : "none"} />
                        Confiance {item.prediction_json.niveau_de_confiance}
                      </span>
                      <strong style={{ fontSize: "13px", color: "var(--text-white)", display: "flex", alignItems: "center", gap: "var(--space-xs)", marginTop: "var(--space-xs)" }}>
                        <TeamLogo teamName={item.equipe_domicile} size={16} />
                        {item.equipe_domicile} - {item.equipe_exterieur}
                        <TeamLogo teamName={item.equipe_exterieur} size={16} />
                      </strong>
                      <span style={{ fontSize: "10px", color: "var(--text-silver)", opacity: 0.7 }}>
                        Score estimé : {item.prediction_json.scores_exacts_probables?.[0]?.score || "N/A"}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteHistory(e, item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(148, 163, 184, 0.4)",
                        cursor: "pointer",
                        padding: "var(--space-xs)",
                        transition: "var(--transition-smooth)"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = "var(--neon-red)"}
                      onMouseOut={(e) => e.currentTarget.style.color = "rgba(148, 163, 184, 0.4)"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid var(--border-color)",
        padding: "var(--layout-gap-grid) 0",
        backgroundColor: "rgba(8, 10, 15, 0.9)",
        fontSize: "11px",
        color: "rgba(148, 163, 184, 0.4)"
      }}>
        <div className="container flex-between">
          <span>Terminal d'analyse Football Prono AI.</span>
          <span>Biais émotionnel éliminé par calcul matriciel.</span>
        </div>
      </footer>
    </div>
  );
}
