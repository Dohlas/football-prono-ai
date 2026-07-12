import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, CornerDownRight, ShieldAlert, Zap } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { apiService } from "../services/api";
import TeamLogo from "../components/TeamLogo";

gsap.registerPlugin(ScrollTrigger);

export default function Report() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [prediction, setPrediction] = useState(location.state?.prediction || null);
  const [loading, setLoading] = useState(!prediction);
  const [error, setError] = useState("");

  // Refs pour cibler les éléments à animer
  const mainRef = useRef(null);
  const headerCardRef = useRef(null);
  const gaugeRef = useRef(null);
  const syntheseRef = useRef(null);
  const cardsRef = useRef([]);
  const distribBarRef = useRef(null);
  const statBarsRef = useRef([]);
  const listItemsRef = useRef([]);

  cardsRef.current = [];
  statBarsRef.current = [];
  listItemsRef.current = [];

  const addToCards = (el) => { if (el && !cardsRef.current.includes(el)) cardsRef.current.push(el); };
  const addToStatBars = (el) => { if (el && !statBarsRef.current.includes(el)) statBarsRef.current.push(el); };
  const addToListItems = (el) => { if (el && !listItemsRef.current.includes(el)) listItemsRef.current.push(el); };

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
          setError("Ce rapport n'existe plus dans votre historique.");
        }
      } catch (err) {
        console.error("[Report.jsx] Erreur chargement rapport historique :", err.message);
        setError("Impossible de charger ce rapport. Réessayez.");
      } finally {
        setLoading(false);
      }
    };

    if (!prediction) {
      loadPredictionFromHistory();
    }
  }, [id, prediction]);

  // --- ANIMATIONS GSAP ---
  // Invariant : toutes les animations sont enregistrées dans un contexte GSAP propre,
  // nettoyé au démontage pour éviter les fuites mémoire.
  useEffect(() => {
    if (loading || error || !prediction) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {

      // 1. ANIMATION D'ENTRÉE : EN-TÊTE DU MATCH
      // Invariant : la carte header entre de bas en haut avec une légère rotation élastique.
      if (headerCardRef.current) {
        gsap.fromTo(
          headerCardRef.current,
          { y: 50, opacity: 0, scale: 0.97 },
          {
            y: 0, opacity: 1, scale: 1,
            duration: 0.9,
            ease: "power3.out",
            clearProps: "transform,opacity"
          }
        );
      }

      // 2. ANIMATION JAUGE CIRCULAIRE SVG (trait qui se remplit avec élasticité)
      // Invariant : le strokeDashoffset doit partir du périmètre complet et descendre à la valeur calculée.
      if (gaugeRef.current) {
        const circleFill = gaugeRef.current.querySelector(".circle-gauge-fill");
        if (circleFill) {
          const circumference = parseFloat(circleFill.getAttribute("stroke-dasharray") || "0");
          const targetOffset = parseFloat(circleFill.style.strokeDashoffset || "0");
          gsap.fromTo(
            circleFill,
            { strokeDashoffset: circumference },
            {
              strokeDashoffset: targetOffset,
              duration: 1.6,
              delay: 0.3,
              ease: "elastic.out(1, 0.6)"
            }
          );
        }
      }

      // 3. STAGGER D'ENTRÉE DES CARTES TACTIQUES (ScrollTrigger)
      // Invariant : chaque carte apparaît séquentiellement à l'entrée dans le viewport.
      if (cardsRef.current.length > 0) {
        cardsRef.current.forEach((card, index) => {
          gsap.fromTo(
            card,
            { y: 45, opacity: 0 },
            {
              y: 0, opacity: 1,
              duration: 0.7,
              ease: "power2.out",
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                toggleActions: "play none none none"
              },
              delay: (index % 2) * 0.1
            }
          );
        });
      }

      // 4. BARRES DE PROBABILITÉ : REMPLISSAGE ANIMÉ AU SCROLL
      // Invariant : chaque barre part de width: 0 et atteint sa valeur cible lors du scroll.
      if (statBarsRef.current.length > 0) {
        statBarsRef.current.forEach((bar) => {
          const targetWidth = bar.style.width;
          bar.style.width = "0%";
          gsap.to(bar, {
            width: targetWidth,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: bar,
              start: "top 90%",
              toggleActions: "play none none none"
            }
          });
        });
      }

      // 5. BARRE DE DISTRIBUTION 1X2 ANIMÉE
      // Invariant : la barre composite (dom/nul/ext) se remplit de gauche à droite.
      if (distribBarRef.current) {
        const segments = distribBarRef.current.querySelectorAll(".distrib-segment");
        const widths = Array.from(segments).map((s) => s.style.width);
        segments.forEach((s) => { s.style.width = "0%"; });
        gsap.to(Array.from(segments), {
          width: (i) => widths[i],
          duration: 1.2,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: distribBarRef.current,
            start: "top 88%",
            toggleActions: "play none none none"
          }
        });
      }

      // 6. SCRUBBING TEXTE SYNTHÈSE (opacity des mots 0.15 → 1.0 au scroll)
      // Invariant : la synthèse doit être scindée en mots, chaque mot scrubbing au scroll.
      if (syntheseRef.current) {
        const spans = syntheseRef.current.querySelectorAll(".word-token");
        if (spans.length > 0) {
          gsap.fromTo(
            spans,
            { opacity: 0.1, color: "var(--text-silver)" },
            {
              opacity: 1,
              color: "var(--text-white)",
              stagger: 0.04,
              ease: "none",
              scrollTrigger: {
                trigger: syntheseRef.current,
                start: "top 75%",
                end: "bottom 20%",
                scrub: 1.2
              }
            }
          );
        }
      }

      // 7. HOVER PHYSICS : ITEMS DES LISTES DE PARIS
      // Invariant : chaque item réagit à l'entrée de la souris avec un translateX de +6px.
      if (listItemsRef.current.length > 0) {
        listItemsRef.current.forEach((item) => {
          const enterHandler = () => gsap.to(item, { x: 6, duration: 0.25, ease: "power2.out" });
          const leaveHandler = () => gsap.to(item, { x: 0, duration: 0.35, ease: "power2.inOut" });
          item.addEventListener("mouseenter", enterHandler);
          item.addEventListener("mouseleave", leaveHandler);
          // Stocker les handlers pour le nettoyage
          item._gsapEnter = enterHandler;
          item._gsapLeave = leaveHandler;
        });
      }

    }, mainRef);

    return () => {
      // Nettoyage des handlers hover physiquement enregistrés sur les DOM nodes
      listItemsRef.current.forEach((item) => {
        if (item._gsapEnter) item.removeEventListener("mouseenter", item._gsapEnter);
        if (item._gsapLeave) item.removeEventListener("mouseleave", item._gsapLeave);
      });
      ctx.revert();
    };
  }, [loading, error, prediction]);

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

  // Scindage de la synthèse en mots pour le scrubbing GSAP
  const syntheseWords = (prediction_json.synthese || "").split(/(\s+)/);

  return (
    <div ref={mainRef} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
        <div
          ref={headerCardRef}
          className="card-tactical grid-match-header"
          style={{
            marginBottom: "30px",
            background: "linear-gradient(135deg, var(--bg-slate) 0%, rgba(30, 35, 48, 0.3) 100%)",
            padding: "30px"
          }}
        >
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
          <div ref={gaugeRef} style={{ display: "flex", justifyContent: "center" }}>
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
                <Zap size={20} style={{ color: "var(--neon-green)", fill: "var(--neon-green)" }} />
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
            <div ref={addToCards} className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Synthèse de Modélisation Quantitative</div>
                <span style={{ fontSize: "10px", color: "var(--text-silver)" }}>[RAPPORT TECHNIQUE]</span>
              </div>
              <p
                ref={syntheseRef}
                style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--text-white)" }}
              >
                {syntheseWords.map((word, i) =>
                  /\s/.test(word)
                    ? word
                    : <span key={i} className="word-token" style={{ display: "inline" }}>{word}</span>
                )}
              </p>
            </div>

            {/* 1X2 & PROBABILITÉS PRIMAIRES */}
            <div ref={addToCards} className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Distribution de Probabilité Primaire (1X2)</div>
                <span style={{ fontSize: "10px", color: "var(--neon-green)" }}>[CALCUL FROID]</span>
              </div>

              <div ref={distribBarRef} className="distrib-bar" style={{ height: "18px", marginBottom: "var(--layout-gap-grid)" }}>
                <div className="distrib-segment distrib-dom" style={{ width: `${prediction_json.resultat_1x2.victoire_domicile}%` }}></div>
                <div className="distrib-segment distrib-nul" style={{ width: `${prediction_json.resultat_1x2.match_nul}%` }}></div>
                <div className="distrib-segment distrib-ext" style={{ width: `${prediction_json.resultat_1x2.victoire_exterieur}%` }}></div>
              </div>

              <div className="grid-three-cols-small" style={{ textAlign: "center" }}>
                <div style={{ border: "1px solid var(--border-color)", padding: "var(--space-ms)", borderRadius: "4px" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-silver)" }}>Victoire Hôte (1)</span>
                  <strong style={{ display: "block", fontSize: "18px", color: "var(--outcome-home-color)", marginTop: "var(--space-xs)" }}>
                    {prediction_json.resultat_1x2.victoire_domicile}%
                  </strong>
                </div>
                <div style={{ border: "1px solid var(--border-color)", padding: "var(--space-ms)", borderRadius: "4px" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-silver)" }}>Match Nul (X)</span>
                  <strong style={{ display: "block", fontSize: "18px", color: "var(--outcome-draw-color)", marginTop: "var(--space-xs)" }}>
                    {prediction_json.resultat_1x2.match_nul}%
                  </strong>
                </div>
                <div style={{ border: "1px solid var(--border-color)", padding: "var(--space-ms)", borderRadius: "4px" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-silver)" }}>Victoire Visiteur (2)</span>
                  <strong style={{ display: "block", fontSize: "18px", color: "var(--outcome-away-color)", marginTop: "var(--space-xs)" }}>
                    {prediction_json.resultat_1x2.victoire_exterieur}%
                  </strong>
                </div>
              </div>
            </div>

            {/* BUTS & BTTS */}
            <div ref={addToCards} className="card-tactical">
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
                      <div
                        ref={addToStatBars}
                        className="stat-bar-fill"
                        style={{ width: `${prediction_json.plus_moins_2_5_buts.plus_de_2_5}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="stat-bar-container">
                    <div className="stat-bar-labels">
                      <span>Moins de 2.5 buts</span>
                      <span style={{ color: "var(--text-white)" }}>{prediction_json.plus_moins_2_5_buts.moins_de_2_5}%</span>
                    </div>
                    <div className="stat-bar-track">
                      <div
                        ref={addToStatBars}
                        className="stat-bar-fill"
                        style={{ width: `${prediction_json.plus_moins_2_5_buts.moins_de_2_5}%`, backgroundColor: "var(--text-silver)", boxShadow: "none" }}
                      ></div>
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
                      <div
                        ref={addToStatBars}
                        className="stat-bar-fill"
                        style={{ width: `${prediction_json.les_deux_equipes_marquent.oui}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="stat-bar-container">
                    <div className="stat-bar-labels">
                      <span>BTTS - Non</span>
                      <span style={{ color: "var(--text-white)" }}>{prediction_json.les_deux_equipes_marquent.non}%</span>
                    </div>
                    <div className="stat-bar-track">
                      <div
                        ref={addToStatBars}
                        className="stat-bar-fill"
                        style={{ width: `${prediction_json.les_deux_equipes_marquent.non}%`, backgroundColor: "var(--text-silver)", boxShadow: "none" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BUTEURS PROBABLES */}
            <div ref={addToCards} className="card-tactical">
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
                      <tr key={idx} style={{ transition: "background 0.2s ease" }}>
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
            <div ref={addToCards} className="card-tactical safe-seat-card">
              <div className="card-header-tech" style={{ borderColor: "rgba(204, 255, 0, 0.15)" }}>
                <div className="card-title-tech" style={{ color: "var(--neon-green)" }}>Arbitrage Recommandé (Risque Faible)</div>
                <span style={{ fontSize: "9px", color: "var(--neon-green)", border: "1px solid rgba(204,255,0,0.3)", padding: "1px 6px", borderRadius: "3px" }}>
                  SAFE SEAT
                </span>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "10px" }}>
                {prediction_json.paris_les_plus_surs.map((bet, idx) => (
                  <li key={idx} ref={addToListItems} style={{ color: "var(--text-white)", display: "flex", gap: "8px", alignItems: "center", cursor: "default", willChange: "transform" }}>
                    <CornerDownRight size={14} style={{ color: "var(--neon-green)", flexShrink: 0 }} />
                    <span>{bet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ZONE EXPOSITION ÉLEVÉE */}
            <div ref={addToCards} className="card-tactical danger-seat-card">
              <div className="card-header-tech" style={{ borderColor: "rgba(255, 59, 48, 0.15)" }}>
                <div className="card-title-tech" style={{ color: "var(--neon-red)" }}>Zone d'Exposition Élevée (À Éviter)</div>
                <span style={{ fontSize: "9px", color: "var(--neon-red)", border: "1px solid rgba(255,59,48,0.3)", padding: "1px 6px", borderRadius: "3px" }}>
                  DANGER
                </span>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "10px" }}>
                {prediction_json.paris_a_eviter.map((bet, idx) => (
                  <li key={idx} ref={addToListItems} style={{ color: "var(--text-white)", display: "flex", gap: "8px", alignItems: "center", cursor: "default", willChange: "transform" }}>
                    <CornerDownRight size={14} style={{ color: "var(--neon-red)", flexShrink: 0 }} />
                    <span>{bet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ESTIMATION CORNERS ET CARTONS */}
            <div ref={addToCards} className="card-tactical">
              <div className="card-header-tech">
                <div className="card-title-tech">Micro-Métriques (Corners & Disciplinaire)</div>
                <span style={{ fontSize: "10px", color: "var(--text-silver)" }}>[DISTRIBUTION]</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Corners */}
                <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                  <h4 style={{ fontSize: "12px", textTransform: "uppercase", marginBottom: "8px", color: "var(--text-white)" }}>Corners Estimés</h4>
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
                  <h4 style={{ fontSize: "12px", textTransform: "uppercase", marginBottom: "8px", color: "var(--text-white)" }}>Cartons Estimés</h4>
                  <div className="flex-between" style={{ fontSize: "13px", marginBottom: "6px" }}>
                    <span>{equipe_domicile}</span>
                    <span style={{ display: "flex", gap: "10px" }}>
                      <span style={{ color: "#FFD700" }}>
                        <span aria-hidden="true" style={{ display: "inline-block", width: "10px", height: "14px", backgroundColor: "#FFD700", borderRadius: "2px", verticalAlign: "middle", marginRight: "4px" }}></span>
                        {prediction_json.cartons_estimes.domicile.jaunes}
                      </span>
                      <span style={{ color: "var(--neon-red)" }}>
                        <span aria-hidden="true" style={{ display: "inline-block", width: "10px", height: "14px", backgroundColor: "var(--neon-red)", borderRadius: "2px", verticalAlign: "middle", marginRight: "4px" }}></span>
                        {prediction_json.cartons_estimes.domicile.rouges}
                      </span>
                    </span>
                  </div>
                  <div className="flex-between" style={{ fontSize: "13px" }}>
                    <span>{equipe_exterieur}</span>
                    <span style={{ display: "flex", gap: "10px" }}>
                      <span style={{ color: "#FFD700" }}>
                        <span aria-hidden="true" style={{ display: "inline-block", width: "10px", height: "14px", backgroundColor: "#FFD700", borderRadius: "2px", verticalAlign: "middle", marginRight: "4px" }}></span>
                        {prediction_json.cartons_estimes.exterieur.jaunes}
                      </span>
                      <span style={{ color: "var(--neon-red)" }}>
                        <span aria-hidden="true" style={{ display: "inline-block", width: "10px", height: "14px", backgroundColor: "var(--neon-red)", borderRadius: "2px", verticalAlign: "middle", marginRight: "4px" }}></span>
                        {prediction_json.cartons_estimes.exterieur.rouges}
                      </span>
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
          <span>Rapport Tactique - Confidentialité Quant.</span>
          <span>Données issues d'un arbitrage froid et rigoureux.</span>
        </div>
      </footer>
    </div>
  );
}
