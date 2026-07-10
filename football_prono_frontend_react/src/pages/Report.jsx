import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, CornerDownRight, ShieldAlert } from "lucide-react";
import { apiService } from "../services/api";
import TeamLogo from "../components/TeamLogo";

export default function Report() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [prediction, setPrediction] = useState(location.state?.prediction || null);
  const [loading, setLoading] = useState(!prediction);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPredictionFromHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const history = await apiService.getHistory();
        const match = history.find(item => item.id === parseInt(id));
        if (match) {
          setPrediction(match);
        } else {
          setError("Rapport introuvable dans l'historique de cet utilisateur.");
        }
      } catch (err) {
        setError("Échec de la récupération du rapport : " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!prediction) {
      loadPredictionFromHistory();
    }
  }, [id, prediction]);

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-silver)" }}>
        Chargement du rapport d'arbitrage...
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="container" style={{ padding: "60px 24px", textAlign: "center" }}>
        <ShieldAlert size={48} style={{ color: "var(--neon-red)", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "24px", color: "var(--text-white)", marginBottom: "12px" }}>Rapport Non Trouvé</h2>
        <p style={{ color: "var(--text-silver)", marginBottom: "24px" }}>{error || "Une anomalie s'est produite lors du chargement."}</p>
        <Link to="/dashboard" className="btn-outline">Retourner au Dashboard</Link>
      </div>
    );
  }

  const { prediction_json, equipe_domicile, equipe_exterieur, match_url } = prediction;

  // Calcul des offsets pour la jauge circulaire de confiance
  const confidencePercent = prediction_json.niveau_de_confiance === "eleve" ? 85 : (prediction_json.niveau_de_confiance === "faible" ? 45 : 65);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidencePercent / 100) * circumference;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER RAPPORT */}
      <header style={{
        borderBottom: "1px solid var(--border-color)",
        backgroundColor: "rgba(18, 22, 32, 0.9)"
      }}>
        <div className="container flex-between" style={{ height: "65px" }}>
          <button onClick={() => navigate("/dashboard")} className="btn-outline" style={{ padding: "6px 14px", fontSize: "11px", height: "35px" }}>
            <ChevronLeft size={12} /> Dashboard
          </button>
          <span style={{ fontFamily: "var(--font-title)", fontWeight: 700, fontSize: "14px", color: "var(--text-white)" }}>
            RAPPORT QUANTITATIF #{id}
          </span>
          <a href={match_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "var(--text-silver)" }}>
            Fiche Match 365Scores ↗
          </a>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="container" style={{ padding: "40px 24px", flex: 1 }}>
        
        {/* EN-TÊTE DU MATCH */}
        <div className="card-tactical grid-match-header" style={{
          marginBottom: "30px",
          background: "linear-gradient(135deg, var(--bg-slate) 0%, rgba(30, 35, 48, 0.3) 100%)",
          padding: "30px"
        }}>
          {/* Équipe Domicile */}
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <TeamLogo teamName={equipe_domicile} size={60} style={{ marginBottom: "8px" }} />
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-white)", lineHeight: 1.1 }}>{equipe_domicile}</h1>
            <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-silver)", letterSpacing: "0.05em", marginTop: "4px" }}>Équipe Hôte</span>
          </div>

          {/* Score Estimé */}
          <div style={{ textAlign: "center" }}>
            <span style={{ display: "block", fontSize: "9px", textTransform: "uppercase", color: "var(--text-silver)", marginBottom: "4px" }}>Score Estimé</span>
            <div style={{
              fontFamily: "var(--font-title)",
              fontSize: "36px",
              color: "var(--neon-green)",
              fontWeight: 700,
              border: "1px solid var(--border-color)",
              padding: "4px 20px",
              borderRadius: "4px",
              backgroundColor: "rgba(8, 10, 15, 0.6)",
              display: "inline-block"
            }}>
              {prediction_json.scores_exacts_probables?.[0]?.score || "0 - 0"}
            </div>
          </div>

          {/* Équipe Extérieur */}
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <TeamLogo teamName={equipe_exterieur} size={60} style={{ marginBottom: "8px" }} />
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-white)", lineHeight: 1.1 }}>{equipe_exterieur}</h1>
            <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-silver)", letterSpacing: "0.05em", marginTop: "4px" }}>Équipe Visiteur</span>
          </div>

          {/* Jauge Confiance */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="circle-gauge-container">
              <svg className="circle-gauge-svg">
                <circle className="circle-gauge-bg" cx="60" cy="60" r={radius} />
                <circle 
                  className="circle-gauge-fill" 
                  cx="60" 
                  cy="60" 
                  r={radius} 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="circle-gauge-text">
                <span style={{ fontSize: "20px" }}>⚡</span>
                <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 600, color: "var(--neon-green)" }}>
                  {prediction_json.niveau_de_confiance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENU EN GRILLE TACTIQUE */}
        <div className="grid-report">
          
          {/* COLONNE GAUCHE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* SYNTHÈSE ANALYTIQUE */}
            <div className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Synthèse de Modélisation Quantitative</div>
                <span style={{ fontSize: "10px", color: "var(--text-silver)" }}>[RAPPORT TECHNIQUE]</span>
              </div>
              <p style={{
                fontSize: "14px",
                lineHeight: "1.7",
                color: "var(--text-white)",
                whiteSpace: "pre-line"
              }}>
                {prediction_json.synthese}
              </p>
            </div>

            {/* 1X2 & PROBABILITÉS PRIMAIRES */}
            <div className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Distribution de Probabilité Primaire (1X2)</div>
                <span style={{ fontSize: "10px", color: "var(--neon-green)" }}>[CALCUL FROID]</span>
              </div>
              
              <div className="distrib-bar" style={{ height: "18px", marginBottom: "20px" }}>
                <div className="distrib-segment distrib-dom" style={{ width: `${prediction_json.resultat_1x2.victoire_domicile}%` }}></div>
                <div className="distrib-segment distrib-nul" style={{ width: `${prediction_json.resultat_1x2.match_nul}%` }}></div>
                <div className="distrib-segment distrib-ext" style={{ width: `${prediction_json.resultat_1x2.victoire_exterieur}%` }}></div>
              </div>

              <div className="grid-three-cols-small" style={{ textAlign: "center" }}>
                <div style={{ border: "1px solid var(--border-color)", padding: "12px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-silver)" }}>Victoire Hôte (1)</span>
                  <strong style={{ display: "block", fontSize: "18px", color: "var(--neon-green)", marginTop: "4px" }}>
                    {prediction_json.resultat_1x2.victoire_domicile}%
                  </strong>
                </div>
                <div style={{ border: "1px solid var(--border-color)", padding: "12px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-silver)" }}>Match Nul (X)</span>
                  <strong style={{ display: "block", fontSize: "18px", color: "var(--text-white)", marginTop: "4px" }}>
                    {prediction_json.resultat_1x2.match_nul}%
                  </strong>
                </div>
                <div style={{ border: "1px solid var(--border-color)", padding: "12px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-silver)" }}>Victoire Visiteur (2)</span>
                  <strong style={{ display: "block", fontSize: "18px", color: "var(--text-silver)", marginTop: "4px" }}>
                    {prediction_json.resultat_1x2.victoire_exterieur}%
                  </strong>
                </div>
              </div>
            </div>

            {/* BUTS & BTTS */}
            <div className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Seuils de Buts & BTTS (Both Teams To Score)</div>
                <span style={{ fontSize: "10px", color: "var(--text-silver)" }}>[FRÉQUENCES ESTIMÉES]</span>
              </div>
              
              <div className="grid-two-cols">
                <div>
                  <div className="stat-bar-container">
                    <div className="stat-bar-labels">
                      <span>Plus de 2.5 buts</span>
                      <span style={{ color: "var(--neon-green)" }}>{prediction_json.plus_moins_2_5_buts.plus_de_2_5}%</span>
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${prediction_json.plus_moins_2_5_buts.plus_de_2_5}%` }}></div>
                    </div>
                  </div>
                  <div className="stat-bar-container">
                    <div className="stat-bar-labels">
                      <span>Moins de 2.5 buts</span>
                      <span style={{ color: "var(--text-white)" }}>{prediction_json.plus_moins_2_5_buts.moins_de_2_5}%</span>
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${prediction_json.plus_moins_2_5_buts.moins_de_2_5}%`, backgroundColor: "var(--text-silver)", boxShadow: "none" }}></div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="stat-bar-container">
                    <div className="stat-bar-labels">
                      <span>BTTS - Oui</span>
                      <span style={{ color: "var(--neon-green)" }}>{prediction_json.les_deux_equipes_marquent.oui}%</span>
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${prediction_json.les_deux_equipes_marquent.oui}%` }}></div>
                    </div>
                  </div>
                  <div className="stat-bar-container">
                    <div className="stat-bar-labels">
                      <span>BTTS - Non</span>
                      <span style={{ color: "var(--text-white)" }}>{prediction_json.les_deux_equipes_marquent.non}%</span>
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${prediction_json.les_deux_equipes_marquent.non}%`, backgroundColor: "var(--text-silver)", boxShadow: "none" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BUTEURS PROBABLES */}
            <div className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Distribution Individuelle (Buteurs Probables)</div>
                <span style={{ fontSize: "10px", color: "var(--text-silver)" }}>[COTES MATHÉMATIQUES]</span>
              </div>
              {prediction_json.buteurs_probables && prediction_json.buteurs_probables.length > 0 ? (
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>Joueur</th>
                      <th>Club</th>
                      <th style={{ textAlign: "right" }}>Probabilité estimée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prediction_json.buteurs_probables.map((scorer, idx) => (
                      <tr key={idx}>
                        <td style={{ color: "var(--text-white)", fontWeight: 600 }}>{scorer.joueur}</td>
                        <td>{scorer.equipe}</td>
                        <td style={{ textAlign: "right", color: "var(--neon-green)", fontFamily: "var(--font-title)", fontWeight: 700 }}>
                          {scorer.probabilite}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "var(--text-silver)", fontSize: "13px", padding: "10px 0" }}>
                  Aucune probabilité de buteur dégagée de manière significative.
                </p>
              )}
            </div>

          </div>

          {/* COLONNE DROITE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* L'ARBITRAGE DE RISQUE (SAFE SEAT) */}
            <div className="card-tactical safe-seat-card">
              <div className="card-header-tech" style={{ borderColor: "rgba(204, 255, 0, 0.15)" }}>
                <div className="card-title-tech" style={{ color: "var(--neon-green)" }}>Arbitrage Recommandé (Risque Faible)</div>
                <span style={{ fontSize: "9px", color: "var(--neon-green)", border: "1px solid rgba(204,255,0,0.3)", padding: "1px 6px", borderRadius: "3px" }}>
                  SAFE SEAT
                </span>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "10px" }}>
                {prediction_json.paris_les_plus_surs.map((bet, idx) => (
                  <li key={idx} style={{ color: "var(--text-white)", display: "flex", gap: "8px", alignItems: "center" }}>
                    <CornerDownRight size={14} style={{ color: "var(--neon-green)", flexShrink: 0 }} />
                    <span>{bet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ZONE EXPOSITION ÉLEVÉE */}
            <div className="card-tactical danger-seat-card">
              <div className="card-header-tech" style={{ borderColor: "rgba(255, 59, 48, 0.15)" }}>
                <div className="card-title-tech" style={{ color: "var(--neon-red)" }}>Zone d'Exposition Élevée (À Éviter)</div>
                <span style={{ fontSize: "9px", color: "var(--neon-red)", border: "1px solid rgba(255,59,48,0.3)", padding: "1px 6px", borderRadius: "3px" }}>
                  DANGER
                </span>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "10px" }}>
                {prediction_json.paris_a_eviter.map((bet, idx) => (
                  <li key={idx} style={{ color: "var(--text-white)", display: "flex", gap: "8px", alignItems: "center" }}>
                    <CornerDownRight size={14} style={{ color: "var(--neon-red)", flexShrink: 0 }} />
                    <span>{bet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ESTIMATION CORNERS ET CARTONS */}
            <div className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Micro-Métriques (Corners & Disciplinaire)</div>
                <span style={{ fontSize: "10px", color: "var(--text-silver)" }}>[DISTRIBUTION]</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Corners */}
                <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                  <h4 style={{ fontSize: "12px", textTransform: "uppercase", marginBottom: "8px", color: "var(--text-white)" }}> Corners Estimés</h4>
                  <div className="flex-between" style={{ fontSize: "13px", marginBottom: "6px" }}>
                    <span>{equipe_domicile}</span>
                    <strong style={{ color: "var(--text-white)" }}>{prediction_json.corners_estimes.domicile.total}</strong>
                  </div>
                  <div className="flex-between" style={{ fontSize: "13px", marginBottom: "6px" }}>
                    <span>{equipe_exterieur}</span>
                    <strong style={{ color: "var(--text-white)" }}>{prediction_json.corners_estimes.exterieur.total}</strong>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-silver)", opacity: 0.7, marginTop: "4px" }}>
                    Mi-temps 1 (Dom: {prediction_json.corners_estimes.domicile.premiere_mi_temps} / Ext: {prediction_json.corners_estimes.exterieur.premiere_mi_temps})
                  </div>
                </div>

                {/* Cartons */}
                <div>
                  <h4 style={{ fontSize: "12px", textTransform: "uppercase", marginBottom: "8px", color: "var(--text-white)" }}> Cartons Estimés</h4>
                  <div className="flex-between" style={{ fontSize: "13px", marginBottom: "6px" }}>
                    <span>{equipe_domicile}</span>
                    <span style={{ display: "flex", gap: "10px" }}>
                      <span style={{ color: "#FFD700" }}>🟨 {prediction_json.cartons_estimes.domicile.jaunes}</span>
                      <span style={{ color: "var(--neon-red)" }}>🟥 {prediction_json.cartons_estimes.domicile.rouges}</span>
                    </span>
                  </div>
                  <div className="flex-between" style={{ fontSize: "13px" }}>
                    <span>{equipe_exterieur}</span>
                    <span style={{ display: "flex", gap: "10px" }}>
                      <span style={{ color: "#FFD700" }}>🟨 {prediction_json.cartons_estimes.exterieur.jaunes}</span>
                      <span style={{ color: "var(--neon-red)" }}>🟥 {prediction_json.cartons_estimes.exterieur.rouges}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer style={{
        marginTop: "60px",
        borderTop: "1px solid var(--border-color)",
        padding: "20px 0",
        backgroundColor: "rgba(8, 10, 15, 0.9)",
        fontSize: "11px",
        color: "rgba(148, 163, 184, 0.4)"
      }}>
        <div className="container flex-between">
          <span>Rapport Tactique v3.5 - Confidentialité Quant.</span>
          <span>Données issues d'un arbitrage froid et rigoureux.</span>
        </div>
      </footer>
    </div>
  );
}
