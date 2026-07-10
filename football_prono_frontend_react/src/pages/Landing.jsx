import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Cpu, BarChart3, ChevronRight, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TeamLogo from "../components/TeamLogo";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  
  // State pour le simulateur interactif
  const [selectedTab, setSelectedTab] = useState("1x2");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER TACTIQUE */}
      <header style={{
        borderBottom: "1px solid var(--border-color)",
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(8, 10, 15, 0.8)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div className="container flex-between" style={{ height: "70px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "12px",
              height: "12px",
              backgroundColor: "var(--neon-green)",
              borderRadius: "2px",
              boxShadow: "0 0 10px var(--neon-green)"
            }}></div>
            <span style={{ 
              fontFamily: "var(--font-title)", 
              fontWeight: 700, 
              fontSize: "18px",
              color: "var(--text-white)",
              letterSpacing: "-0.03em"
            }}>
              FOOTBALL PRONO <span style={{ color: "var(--neon-green)" }}>AI</span>
            </span>
          </div>
          <nav style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-neon" style={{ padding: "8px 16px", fontSize: "12px" }}>
                Accéder au Terminal <ChevronRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/auth" style={{ color: "var(--text-white)", fontWeight: 500 }}>Connexion</Link>
                <Link to="/auth?register=true" className="btn-neon" style={{ padding: "8px 16px", fontSize: "12px" }}>
                  Terminal Gratuit <ChevronRight size={14} />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{ padding: "80px 0 60px 0", position: "relative" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "800px" }}>
          <span style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--neon-green)",
            fontFamily: "var(--font-title)",
            fontWeight: 600,
            border: "1px solid rgba(204, 255, 0, 0.2)",
            padding: "4px 12px",
            borderRadius: "20px",
            backgroundColor: "rgba(204, 255, 0, 0.03)",
            display: "inline-block",
            marginBottom: "24px"
          }}>
            Modèle Quantitatif Prédictif v3.5
          </span>
          <h1 style={{
            fontSize: "56px",
            lineHeight: "1.1",
            marginBottom: "24px",
            letterSpacing: "-0.04em",
            fontWeight: 800
          }}>
            Le hasard n’a pas sa place sur le terrain.
          </h1>
          <p style={{
            fontSize: "16px",
            color: "var(--text-silver)",
            marginBottom: "40px",
            lineHeight: "1.7",
            maxWidth: "680px",
            margin: "0 auto 40px auto"
          }}>
            Faites passer vos analyses sportives dans l’ère quantitative. Notre algorithme extrait en temps réel des milliers de métriques de forme et de cotes pour générer un modèle prédictif froid et purement statistique. L'IA calcule. Vous décidez.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Link to={isAuthenticated ? "/dashboard" : "/auth"} className="btn-neon">
              Lancer le terminal d'analyse <ChevronRight size={16} />
            </Link>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(148, 163, 184, 0.5)", marginTop: "16px" }}>
            Aucune carte bancaire requise. Analyse de match instantanée.
          </p>
        </div>
      </section>

      {/* INTERACTIVE MOCK / CONCEPT CROCHET (Aesthetic-Usability Effect) */}
      <section style={{ padding: "40px 0 80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "28px", marginBottom: "12px" }}>
              Nous ne prédisons pas l’avenir. Nous calculons la variance.
            </h2>
            <p style={{ color: "var(--text-silver)", maxWidth: "600px", margin: "0 auto" }}>
              La plupart des parieurs perdent parce qu’ils analysent avec leurs émotions. Football Prono AI élimine les biais subjectifs et fournit un arbitrage mathématique.
            </p>
          </div>

          {/* Faux rapport interactif */}
          <div className="card-tactical" style={{ maxWidth: "800px", margin: "0 auto", padding: "0" }}>
            {/* Header du match simulé */}
            <div style={{
              padding: "24px",
              borderBottom: "1px solid var(--border-color)",
              background: "linear-gradient(to bottom, rgba(30, 35, 48, 0.4), transparent)"
            }}>
              <div className="flex-between" style={{ marginBottom: "16px" }}>
                <span style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--neon-green)",
                  border: "1px solid rgba(204, 255, 0, 0.2)",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(204, 255, 0, 0.05)",
                  boxShadow: "0 0 10px rgba(204, 255, 0, 0.15)",
                  display: "inline-block"
                }}>
                  Simulation Technique Interactive
                </span>
                <span style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px",
                  color: "var(--neon-green)",
                  fontSize: "12px",
                  fontWeight: 600
                }}>
                  <Zap size={14} fill="var(--neon-green)" /> 84% de Confiance
                </span>
              </div>
              <div className="flex-between" style={{ justifyContent: "space-around", textAlign: "center", alignItems: "center" }}>
                <div style={{ width: "40%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <TeamLogo teamName="Allemagne" size={48} style={{ marginBottom: "8px" }} />
                  <h3 style={{ fontSize: "20px" }}>Allemagne</h3>
                  <span style={{ fontSize: "11px", color: "var(--text-silver)" }}>Domicile</span>
                </div>
                <div style={{ 
                  fontFamily: "var(--font-title)", 
                  fontSize: "32px", 
                  color: "var(--neon-green)", 
                  fontWeight: 700,
                  border: "1px solid var(--border-color)",
                  padding: "4px 16px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(8, 10, 15, 0.6)",
                  boxShadow: "0 0 12px rgba(204, 255, 0, 0.1)"
                }}>
                  2 - 1
                </div>
                <div style={{ width: "40%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <TeamLogo teamName="Côte d'Ivoire" size={48} style={{ marginBottom: "8px" }} />
                  <h3 style={{ fontSize: "20px" }}>Côte d'Ivoire</h3>
                  <span style={{ fontSize: "11px", color: "var(--text-silver)" }}>Extérieur</span>
                </div>
              </div>
            </div>

            {/* Onglets tactiques */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", backgroundColor: "rgba(18, 22, 32, 0.5)" }}>
              {[
                { id: "1x2", label: "Probabilités 1X2" },
                { id: "goals", label: "Buts & BTTS" },
                { id: "expert", label: "Arbitrage de Risque" }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "none",
                    border: "none",
                    borderBottom: selectedTab === tab.id ? "2px solid var(--neon-green)" : "2px solid transparent",
                    color: selectedTab === tab.id ? "var(--text-white)" : "var(--text-silver)",
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "var(--transition-smooth)"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenu des onglets */}
            <div style={{ padding: "24px", minHeight: "200px" }}>
              {selectedTab === "1x2" && (
                <div>
                  <p style={{ marginBottom: "20px", fontSize: "13px" }}>
                    Distribution de probabilité froide sur le résultat réglementaire final :
                  </p>
                  <div className="distrib-bar" style={{ height: "16px" }}>
                    <div className="distrib-segment distrib-dom" style={{ width: "44%" }}></div>
                    <div className="distrib-segment distrib-nul" style={{ width: "31%" }}></div>
                    <div className="distrib-segment distrib-ext" style={{ width: "25%" }}></div>
                  </div>
                  <div className="flex-between-responsive" style={{ fontFamily: "var(--font-title)", fontSize: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ 
                        display: "inline-block", 
                        width: "8px", 
                        height: "8px", 
                        backgroundColor: "var(--neon-green)", 
                        borderRadius: "1px",
                        boxShadow: "0 0 6px var(--neon-green)"
                      }}></span>
                      <span>Allemagne : 44%</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--text-silver)", borderRadius: "1px" }}></span>
                      <span>Match Nul : 31%</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--bg-technical)", border: "1px solid rgba(148, 163, 184, 0.3)", borderRadius: "1px" }}></span>
                      <span>Côte d'Ivoire : 25%</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "goals" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className="stat-bar-container">
                    <div className="stat-bar-labels">
                      <span>Plus de 2.5 Buts</span>
                      <span style={{ color: "var(--neon-green)" }}>58%</span>
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: "58%" }}></div>
                    </div>
                  </div>
                  <div className="stat-bar-container">
                    <div className="stat-bar-labels">
                      <span>Les deux équipes marquent (BTTS - Oui)</span>
                      <span style={{ color: "var(--neon-green)" }}>64%</span>
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: "64%" }}></div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "expert" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="card-tactical safe-seat-card" style={{ padding: "16px" }}>
                    <div className="card-header-tech" style={{ paddingBottom: "6px", marginBottom: "8px", borderColor: "rgba(204, 255, 0, 0.1)" }}>
                      <div className="card-title-tech" style={{ fontSize: "9px" }}>Arbitrage Recommandé (Risque Faible)</div>
                    </div>
                    <p style={{ color: "var(--text-white)", fontSize: "13px", fontWeight: 500 }}>
                      Double chance : Allemagne ou Nul & Plus de 1.5 buts cumulés.
                    </p>
                  </div>
                  <div className="card-tactical danger-seat-card" style={{ padding: "16px" }}>
                    <div className="card-header-tech" style={{ paddingBottom: "6px", marginBottom: "8px", borderColor: "rgba(255, 59, 48, 0.1)" }}>
                      <div className="card-title-tech" style={{ fontSize: "9px", color: "var(--neon-red)" }}>Zone d'Exposition Élevée (À Éviter)</div>
                    </div>
                    <p style={{ color: "var(--text-white)", fontSize: "13px", fontWeight: 500 }}>
                      Pari simple Allemagne sec. La Côte d'Ivoire a dominé la première mi-temps et le match s'est joué sur un contre à la dernière minute.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* METRIC / HOW IT WORKS */}
      <section style={{
        padding: "60px 0",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "rgba(18, 22, 32, 0.2)"
      }}>
        <div className="container">
          <div className="grid-three-cols">
            <div className="card-tactical">
              <div style={{ color: "var(--neon-green)", marginBottom: "16px" }}><Cpu size={24} /></div>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>1. Ingestion de données</h3>
              <p style={{ color: "var(--text-silver)", fontSize: "13px" }}>
                On extrait instantanément toutes les statistiques de 365Scores. Dynamique de forme, historique des confrontations et évolution des cotes : rien n'est laissé au hasard.
              </p>
            </div>
            <div className="card-tactical">
              <div style={{ color: "var(--neon-green)", marginBottom: "16px" }}><ShieldCheck size={24} /></div>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>2. Modélisation Statistique</h3>
              <p style={{ color: "var(--text-silver)", fontSize: "13px" }}>
                L'intelligence artificielle croise ces données à travers des milliers de simulations pour vous révéler les scénarios de match les plus probables.
              </p>
            </div>
            <div className="card-tactical">
              <div style={{ color: "var(--neon-green)", marginBottom: "16px" }}><BarChart3 size={24} /></div>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>3. Rapport d’Arbitrage</h3>
              <p style={{ color: "var(--text-silver)", fontSize: "13px" }}>
                Vous obtenez un rapport d'analyse clair pour identifier les opportunités à faible risque et éviter les pièges statistiques.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        marginTop: "auto",
        borderTop: "1px solid var(--border-color)",
        padding: "30px 0",
        backgroundColor: "rgba(8, 10, 15, 0.9)"
      }}>
        <div className="container flex-between" style={{ fontSize: "12px", color: "rgba(148, 163, 184, 0.4)" }}>
          <span>© 2026 FOOTBALL PRONO AI. Tous droits réservés.</span>
          <span>Données traitées froidement sans biais affectif.</span>
        </div>
      </footer>
    </div>
  );
}
