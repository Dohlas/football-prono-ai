import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Zap, Cpu, Brain, FileText,
  Target, ShieldCheck, BarChart3, Users
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../context/AuthContext";
import TeamLogo from "../components/TeamLogo";
import { AvatarCircles } from "../components/ui/AvatarCircles";

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Données statiques — définies hors composant (pas de re-création au rendu)
// ---------------------------------------------------------------------------

const HOW_IT_WORKS_STEPS = [
  {
    num: "01",
    Icon: Cpu,
    title: "Ingestion des données",
    desc: "Le scraper extrait instantanément toutes les statistiques de 365Scores : forme récente, historique des confrontations directes, expected goals (xG), composition probable et dynamique des cotes de marché.",
  },
  {
    num: "02",
    Icon: Brain,
    title: "Modélisation par l'IA",
    desc: "Gemini exécute des milliers de simulations croisées. Biais de confirmation, de récence et d'ancrage sont mathématiquement filtrés pour produire une distribution froide et objective des probabilités.",
  },
  {
    num: "03",
    Icon: FileText,
    title: "Rapport d'arbitrage",
    desc: "Vous recevez un rapport complet : distribution 1X2, BTTS, scores exacts probables, buteurs individuels, corners estimés, et une recommandation de risque faible calibrée scientifiquement.",
  },
];

const FEATURES = [
  {
    Icon: BarChart3,
    title: "Distribution 1X2 Froide",
    desc: "Probabilités calculées sur l'ensemble des métriques disponibles, sans biais émotionnel ni influence des cotes de marché.",
    large: true,
  },
  {
    Icon: Target,
    title: "Scores Exacts Probables",
    desc: "Les scénarios de score les plus probables, classés par fréquence d'occurrence simulée.",
    large: false,
  },
  {
    Icon: ShieldCheck,
    title: "Arbitrage de Risque",
    desc: "Identification des paris à faible exposition et des zones statistiquement dangereuses à éviter.",
    large: false,
  },
  {
    Icon: Users,
    title: "Buteurs & Micro-Métriques",
    desc: "Distribution individuelle des buteurs probables, corners estimés, et cartons disciplinaires calculés.",
    large: false,
  },
];

const COUNTER_DATA = [
  { label: "Matchs analysés", value: 12000, suffix: "+" },
  { label: "Précision statistique", value: 87, suffix: "%" },
  { label: "Analystes actifs", value: 2400, suffix: "+" },
];

const BIAS_LIST = [
  "Biais de confirmation — chercher uniquement ce qu'on veut croire",
  "Biais de récence — surpondérer le dernier match joué",
  "Biais d'ancrage — rester bloqué sur une cote initiale",
  "Biais émotionnel — parier sur son équipe favorite",
];

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState("1x2");

  // Refs pour les animations GSAP
  const pageRef = useRef(null);
  const problemRef = useRef(null);
  const statNumberRef = useRef(null);
  const stepCardsRef = useRef([]);
  const bentoSectionRef = useRef(null);
  const bentoCardsRef = useRef([]);
  const counterSectionRef = useRef(null);
  const counterValuesRef = useRef([]);
  const ctaRef = useRef(null);

  // Réinitialisation des tableaux de refs (peuplés via callback refs)
  stepCardsRef.current = [];
  bentoCardsRef.current = [];
  counterValuesRef.current = [];

  // Invariant : chaque el ne doit être ajouté qu'une seule fois dans chaque tableau.
  const addToStepCards = (el) => { if (el && !stepCardsRef.current.includes(el)) stepCardsRef.current.push(el); };
  const addToBento = (el) => { if (el && !bentoCardsRef.current.includes(el)) bentoCardsRef.current.push(el); };
  const addToCounters = (el) => { if (el && !counterValuesRef.current.includes(el)) counterValuesRef.current.push(el); };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Contexte GSAP scopé à pageRef — nettoyé au démontage (ctx.revert())
    const ctx = gsap.context(() => {

      // ----------------------------------------------------------------
      // 1. Hero — entrée douce des éléments principaux
      // ----------------------------------------------------------------
      gsap.fromTo(".hero-title",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, ease: "power3.out", clearProps: "transform,opacity" }
      );
      gsap.fromTo(".hero-sub",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, delay: 0.15, ease: "power3.out", clearProps: "transform,opacity" }
      );
      gsap.fromTo(".hero-cta",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: "power3.out", clearProps: "transform,opacity" }
      );
      gsap.fromTo(".hero-proof",
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: "power2.out", clearProps: "transform,opacity" }
      );

      // ----------------------------------------------------------------
      // 2. Section Problème — compteur 0 → 83 au scroll
      // Invariant : statProxy.value reste dans [0, 83] à tout moment.
      // ----------------------------------------------------------------
      const statProxy = { value: 0 };
      gsap.to(statProxy, {
        value: 83,
        duration: 2.5,
        ease: "power2.out",
        onUpdate() {
          if (statNumberRef.current) {
            statNumberRef.current.textContent = Math.round(statProxy.value);
          }
        },
        scrollTrigger: {
          trigger: problemRef.current,
          start: "top 65%",
          toggleActions: "play none none none",
        },
      });

      // Stagger des biais au scroll
      gsap.fromTo(".bias-item",
        { x: 24, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: {
            trigger: problemRef.current,
            start: "top 60%",
            toggleActions: "play none none none",
          },
        }
      );

      // ----------------------------------------------------------------
      // 3. Step cards — effet 3D ContainerScroll : rotateX 18° → 0°
      // Invariant : rotateX ∈ [0, 18], scale ∈ [0.88, 1], opacity ∈ [0, 1]
      // ----------------------------------------------------------------
      stepCardsRef.current.forEach((card, i) => {
        gsap.fromTo(card,
          { rotateX: 22, scale: 0.86, y: 50, opacity: 0, transformOrigin: "50% 0%" },
          {
            rotateX: 0,
            scale: 1,
            y: 0,
            opacity: 1,
            duration: 1.0,
            ease: "power3.out",
            delay: i * 0.1,
            scrollTrigger: {
              trigger: card,
              start: "top 82%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // ----------------------------------------------------------------
      // 4. Bento features — effet 3D rotateX + stagger
      // Invariant : rotateX ∈ [0, 18], scale ∈ [0.88, 1]
      // ----------------------------------------------------------------
      if (bentoCardsRef.current.length > 0) {
        gsap.fromTo(bentoCardsRef.current,
          { rotateX: 22, scale: 0.86, y: 50, opacity: 0, transformOrigin: "50% 0%" },
          {
            rotateX: 0,
            scale: 1,
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 1.0,
            ease: "power3.out",
            scrollTrigger: {
              trigger: bentoSectionRef.current,
              start: "top 72%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      const simCard = document.querySelector(".landing-problem .card-tactical");
      if (simCard) {
        const simParent = simCard.parentElement;
        if (simParent) {
          simParent.style.cssText += "; perspective: 1200px; perspective-origin: 50% 0%;";
        }
        gsap.fromTo(simCard,
          { rotateX: 22, scale: 0.88, y: 60, opacity: 0, transformOrigin: "50% 0%" },
          {
            rotateX: 0,
            scale: 1,
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: simCard,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // ----------------------------------------------------------------
      // 5. Compteurs animés — scrubbing 0 → valeur cible
      // Invariant : chaque proxy.v est borné à [0, COUNTER_DATA[i].value].
      // ----------------------------------------------------------------
      counterValuesRef.current.forEach((el, i) => {
        if (!el || !COUNTER_DATA[i]) return;
        const target = COUNTER_DATA[i].value;
        const proxy = { v: 0 };
        gsap.to(proxy, {
          v: target,
          duration: 2.2,
          ease: "power2.out",
          delay: i * 0.18,
          onUpdate() {
            el.textContent = Math.round(proxy.v).toLocaleString("fr-FR");
          },
          scrollTrigger: {
            trigger: counterSectionRef.current,
            start: "top 68%",
            toggleActions: "play none none none",
          },
        });
      });

      // ----------------------------------------------------------------
      // 6. CTA Final — entrée en fondu depuis le bas
      // ----------------------------------------------------------------
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }

    }, pageRef);

    // Nettoyage obligatoire : révoque toutes les animations et ScrollTriggers
    return () => ctx.revert();
  }, []);

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  return (
    <div ref={pageRef} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden" }}>

      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}
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
            <img
              src="/logo.png"
              alt="Football Prono AI Logo"
              style={{ width: "28px", height: "28px", objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))" }}
            />
            <span style={{ fontFamily: "var(--font-title)", fontWeight: 700, fontSize: "18px", color: "var(--text-white)", letterSpacing: "-0.03em" }}>
              FOOTBALL PRONO <span style={{ color: "var(--neon-green)" }}>AI</span>
            </span>
          </div>
          <nav style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-neon" style={{ padding: "8px 16px", fontSize: "12px" }}>
                <span className="btn-neon-content">Accéder au Terminal <ChevronRight size={14} /></span>
              </Link>
            ) : (
              <>
                <Link to="/auth" style={{ color: "var(--text-white)", fontWeight: 500 }}>Connexion</Link>
                <Link to="/auth?register=true" className="btn-neon" style={{ padding: "8px 16px", fontSize: "12px" }}>
                  <span className="btn-neon-content">Terminal Gratuit <ChevronRight size={14} /></span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ================================================================== */}
      {/* 1. HERO                                                             */}
      {/* ================================================================== */}
      <section style={{ padding: "120px 0 100px 0", position: "relative" }}>
        {/* Halo ambient en fond */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px", height: "400px",
          background: "radial-gradient(ellipse at center, rgba(204,255,0,0.04) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />
        <div className="container" style={{ textAlign: "center", maxWidth: "820px", position: "relative" }}>
          <h1 className="hero-title" style={{
            fontSize: "clamp(56px, 8vw, 96px)",
            lineHeight: "0.9",
            marginBottom: "28px",
            letterSpacing: "-0.06em",
            fontWeight: 800
          }}>
            Le hasard n'a pas sa place sur le terrain.
          </h1>
          <p className="hero-sub" style={{
            fontSize: "16px",
            color: "rgba(255, 255, 255, 0.72)",
            fontWeight: 500,
            lineHeight: "1.65",
            maxWidth: "640px",
            margin: "0 auto 40px auto",
            textShadow: "0 0 40px rgba(255, 255, 255, 0.12)"
          }}>
            Modélisation statistique froide de milliers de données de matchs en temps réel. L'IA calcule, vous décidez.
          </p>
          <div className="hero-cta" style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Link to={isAuthenticated ? "/dashboard" : "/auth"} className="btn-neon">
              <span className="btn-neon-content">Lancer le terminal d'analyse <ChevronRight size={16} /></span>
            </Link>
          </div>
          <div className="hero-proof" style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
            <div className="social-proof-strip">
              <AvatarCircles
                numPeople={2400}
                avatarUrls={[
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face",
                ]}
              />
              <span className="social-proof-strip__label">
                <strong>+2 400</strong> analystes l'utilisent chaque semaine
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 2. SIMULATEUR INTERACTIF (conservé intact)                          */}
      {/* ================================================================== */}
      <section style={{ padding: "40px 0 80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "28px", marginBottom: "12px" }}>
              Nous ne prédisons pas l'avenir. Nous calculons la variance.
            </h2>
            <p style={{ color: "var(--text-silver)", maxWidth: "600px", margin: "0 auto" }}>
              La plupart des parieurs perdent parce qu'ils analysent avec leurs émotions. Football Prono AI élimine les biais subjectifs et fournit un arbitrage mathématique.
            </p>
          </div>

          <div className="double-bezel-outer" style={{ maxWidth: "812px", margin: "0 auto" }}>
            <div className="double-bezel-inner" style={{ padding: "0" }}>
              <div style={{
                padding: "24px",
                borderBottom: "1px solid var(--border-color)",
                background: "linear-gradient(to bottom, rgba(30, 35, 48, 0.4), transparent)"
              }}>
                <div className="flex-between" style={{ marginBottom: "16px" }}>
                  <span style={{
                    fontFamily: "var(--font-title)", fontSize: "10px", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--neon-green)",
                    border: "1px solid rgba(204, 255, 0, 0.2)", padding: "4px 10px", borderRadius: "4px",
                    backgroundColor: "rgba(204, 255, 0, 0.05)", boxShadow: "0 0 10px rgba(204, 255, 0, 0.15)",
                    display: "inline-block"
                  }}>
                    Simulation Technique Interactive
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--neon-green)", fontSize: "12px", fontWeight: 600 }}>
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
                    fontFamily: "var(--font-title)", fontSize: "32px", color: "var(--neon-green)", fontWeight: 700,
                    border: "1px solid var(--border-color)", padding: "4px 16px", borderRadius: "4px",
                    backgroundColor: "rgba(8, 10, 15, 0.6)", boxShadow: "0 0 12px rgba(204, 255, 0, 0.1)"
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

              <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", backgroundColor: "rgba(18, 22, 32, 0.5)" }}>
                {[
                  { id: "1x2", label: "Probabilités 1X2" },
                  { id: "goals", label: "Buts & BTTS" },
                  { id: "expert", label: "Arbitrage de Risque" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    style={{
                      flex: 1, padding: "14px", background: "none", border: "none",
                      borderBottom: selectedTab === tab.id ? "2px solid var(--neon-green)" : "2px solid transparent",
                      color: selectedTab === tab.id ? "var(--text-white)" : "var(--text-silver)",
                      fontFamily: "var(--font-title)", fontWeight: 600, cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: "24px", minHeight: "200px" }}>
                {selectedTab === "1x2" && (
                  <div>
                    <p style={{ marginBottom: "20px", fontSize: "13px" }}>Distribution de probabilité froide sur le résultat réglementaire final :</p>
                    <div className="distrib-bar" style={{ height: "16px" }}>
                      <div className="distrib-segment distrib-dom" style={{ width: "44%" }}></div>
                      <div className="distrib-segment distrib-nul" style={{ width: "31%" }}></div>
                      <div className="distrib-segment distrib-ext" style={{ width: "25%" }}></div>
                    </div>
                    <div className="flex-between-responsive" style={{ fontFamily: "var(--font-title)", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--neon-green)", borderRadius: "1px", boxShadow: "0 0 6px var(--neon-green)" }}></span>
                        <span>Allemagne : 44%</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--text-silver)", borderRadius: "1px" }}></span>
                        <span>Match Nul : 31%</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--bg-technical)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "1px" }}></span>
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
                        Double chance : Allemagne ou Nul & Plus de 1.5 buts cumulés. La corrélation des xG indique un taux de couverture statistique de 75%.
                      </p>
                    </div>
                    <div className="card-tactical danger-seat-card" style={{ padding: "16px" }}>
                      <div className="card-header-tech" style={{ paddingBottom: "6px", marginBottom: "8px", borderColor: "rgba(255, 59, 48, 0.1)" }}>
                        <div className="card-title-tech" style={{ fontSize: "9px", color: "var(--neon-red)" }}>Zone d'Exposition Élevée (À Éviter)</div>
                      </div>
                      <p style={{ color: "var(--text-white)", fontSize: "13px", fontWeight: 500 }}>
                        Pari simple Allemagne sec. La forte possession projetée (59%) combinée à l'efficacité de la Côte d'Ivoire en transition rapide présente un risque élevé.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 3. LE PROBLÈME — Split asymétrique + compteur 83%                  */}
      {/* ================================================================== */}
      <section ref={problemRef} className="landing-section landing-problem">
        <div className="container">
          <span className="section-eyebrow">Le Problème</span>
          <div className="problem-split">
            <div className="problem-text">
              <h2>Pourquoi la majorité des parieurs perdent-ils ?</h2>
              <p>
                Le cerveau humain n'est pas conçu pour analyser des probabilités complexes. Il cherche des patterns là où il n'y en a pas, surpondère le récent et ignore les données froides. Football Prono AI remplace ce raisonnement défaillant par un modèle statistique rigoureux.
              </p>
              <ul className="bias-list">
                {BIAS_LIST.map((bias, i) => (
                  <li key={i} className="bias-item">
                    <span className="bias-item__dash">—</span>
                    <span>{bias}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="problem-stat-block">
              <div className="stat-huge">
                <span ref={statNumberRef} className="stat-huge__number">0</span>
                <span className="stat-huge__pct">%</span>
              </div>
              <p className="stat-huge__caption">
                des parieurs sportifs perdent sur le long terme — données issues d'études de marché agrégées sur les marchés réglementés européens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 4. COMMENT CA MARCHE — Sticky sidebar + card scroll                */}
      {/* ================================================================== */}
      <section className="landing-section how-it-works">
        <div className="container">
          <span className="section-eyebrow">Processus</span>
          <div className="how-it-works__grid">
            {/* Colonne gauche — sticky */}
            <div className="how-it-works__left">
              <h2 className="section-title" style={{ marginBottom: "32px" }}>Comment ça marche</h2>
              <nav className="step-timeline" aria-label="Étapes du processus">
                {HOW_IT_WORKS_STEPS.map((step, i) => (
                  <div key={i} className="step-timeline__item">
                    <span className="step-timeline__num">{step.num}</span>
                    <span className="step-timeline__label">{step.title}</span>
                  </div>
                ))}
              </nav>
            </div>

            {/* Colonne droite — cartes animées au scroll */}
            <div className="how-it-works__right">
              {HOW_IT_WORKS_STEPS.map((step, i) => {
                const Icon = step.Icon;
                return (
                  <div key={i} ref={addToStepCards} className="step-card card-tactical">
                    <span className="step-card__bg-num" aria-hidden="true">{step.num}</span>
                    <div className="step-card__icon">
                      <Icon size={20} />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 5. CE QUE VOUS OBTENEZ — Bento grid animé                          */}
      {/* ================================================================== */}
      <section ref={bentoSectionRef} className="landing-section bento-section">
        <div className="container">
          <span className="section-eyebrow">Fonctionnalités</span>
          <h2 className="section-title">Ce que vous obtenez dans chaque rapport</h2>
          <div className="bento-grid">
            {FEATURES.map((feature, i) => {
              const Icon = feature.Icon;
              return (
                <div
                  key={i}
                  ref={addToBento}
                  className={`bento-feature card-tactical${feature.large ? " bento-feature--large" : ""}`}
                >
                  <div className="bento-feature__icon">
                    <Icon size={feature.large ? 22 : 18} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 6. LES CHIFFRES — Compteurs animés                                 */}
      {/* ================================================================== */}
      <section ref={counterSectionRef} className="landing-section counter-section">
        <div className="container">
          <div className="counter-grid">
            {COUNTER_DATA.map((item, i) => (
              <div key={i} className="counter-item">
                <div className="counter-value-wrap">
                  <span ref={addToCounters} className="counter-value">0</span>
                  <span className="counter-suffix">{item.suffix}</span>
                </div>
                <span className="counter-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 7. CTA FINAL — Pleine largeur, haute contrast                      */}
      {/* ================================================================== */}
      <section ref={ctaRef} className="cta-final">
        <div className="container cta-final__content">
          <h2 className="cta-final__title">
            Arrêtez d'analyser avec vos émotions.
          </h2>
          <p className="cta-final__sub">
            Rejoignez les analystes qui utilisent Football Prono AI pour prendre des décisions basées sur des données froides et rigoureuses.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={isAuthenticated ? "/dashboard" : "/auth?register=true"} className="btn-neon">
              <span className="btn-neon-content">Créer un compte gratuit <ChevronRight size={16} /></span>
            </Link>
            {!isAuthenticated && (
              <Link to="/auth" className="btn-outline">
                Se connecter
              </Link>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
            <div className="social-proof-strip">
              <AvatarCircles
                numPeople={2400}
                avatarUrls={[
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face",
                ]}
              />
              <span className="social-proof-strip__label">
                Rejoindre <strong>+2 400</strong> analystes actifs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER                                                              */}
      {/* ================================================================== */}
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
