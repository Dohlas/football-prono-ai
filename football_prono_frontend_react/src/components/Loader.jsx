import React from "react";

export default function Loader({ logs = [] }) {
  return (
    <div style={{
      minHeight: "70vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px"
    }}>
      <div className="card-tactical" style={{
        width: "100%",
        maxWidth: "600px",
        borderColor: "var(--neon-green)"
      }}>
        {/* En-tête technique */}
        <div className="card-header-tech">
          <div className="card-title-tech">Calculs Statistiques en Cours</div>
          <span style={{ 
            fontFamily: "monospace", 
            fontSize: "10px", 
            color: "var(--neon-green)",
            animation: "pulse-slow 1s infinite" 
          }}>
            [CPU LOAD: ACTIVE]
          </span>
        </div>

        {/* Skeleton Screen simulé */}
        <div style={{ marginBottom: "30px" }}>
          <div className="skeleton-shimmer" style={{ height: "16px", width: "80%", marginBottom: "12px", borderRadius: "2px" }}></div>
          <div className="skeleton-shimmer" style={{ height: "12px", width: "95%", marginBottom: "8px", borderRadius: "2px" }}></div>
          <div className="skeleton-shimmer" style={{ height: "12px", width: "60%", marginBottom: "8px", borderRadius: "2px" }}></div>
        </div>

        {/* Logs Terminal tactiques (Operational Transparency réelle) */}
        <div style={{
          backgroundColor: "#050608",
          border: "1px solid var(--border-color)",
          borderRadius: "4px",
          padding: "20px",
          fontFamily: "monospace",
          fontSize: "12px",
          lineHeight: "1.8",
          minHeight: "180px"
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ color: "#39FF14", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
              <span className={index === logs.length - 1 ? "terminal-log-line active" : ""}>
                &gt; {log.text}
              </span>
              {log.done && <span style={{ color: "var(--text-white)", marginLeft: "10px" }}>[OK]</span>}
            </div>
          ))}
          {logs.length === 0 && (
            <div style={{ color: "var(--text-silver)", opacity: 0.5, animation: "pulse-slow 1s infinite" }}>
              &gt; Lancement des processus de calcul quantitatif...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
