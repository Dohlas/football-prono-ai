const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Durées de timeout (ms) par catégorie d'endpoint.
 * - AUTH : 45s — le backend Render (plan gratuit) peut mettre 30-50s à sortir de veille (cold start).
 * - ANALYSIS : 90s — le scraping 365Scores + l'appel Gemini prennent du temps.
 * - DEFAULT : 45s — marge suffisante pour le cold start sur les autres routes.
 */
const TIMEOUT_MS = {
  AUTH: 45_000,
  ANALYSIS: 90_000,
  DEFAULT: 45_000,
};

/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  SÉPARATION DES MESSAGES D'ERREUR (FRONTEND)
 *
 *  Messages INTERNES (console.error) :
 *    → Techniques, pour le debug développeur dans la console navigateur.
 *
 *  Messages UTILISATEUR (throw new Error → affiché via setError dans les pages) :
 *    → Chaleureux, clairs, en français, sans jargon.
 *    → "Oups" quand c'est de notre faute, pas de la leur.
 *    → Proposent toujours une action (réessayer, vérifier, patienter).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Identifie la catégorie d'un endpoint pour adapter le timeout.
 * @param {string} endpoint — chemin de l'API (ex: "/api/auth/login")
 * @returns {"AUTH" | "ANALYSIS" | "DEFAULT"}
 */
function classifyEndpoint(endpoint) {
  if (endpoint.startsWith("/api/auth")) {
    return "AUTH";
  }
  if (endpoint.includes("/predictions/analyser") || endpoint.includes("/api/analyser")) {
    return "ANALYSIS";
  }
  return "DEFAULT";
}

/**
 * Construit un message d'erreur de timeout UTILISATEUR adapté au contexte.
 * @param {"AUTH" | "ANALYSIS" | "DEFAULT"} category
 * @returns {string} Message UX-friendly
 */
function buildTimeoutMessage(category) {
  switch (category) {
    case "AUTH":
      return "La connexion prend plus de temps que prévu. Le serveur est peut-être en train de démarrer — réessayez dans quelques secondes.";
    case "ANALYSIS":
      return "L'analyse prend plus de temps que prévu. Réessayez ou vérifiez le lien du match.";
    default:
      return "La requête prend plus de temps que prévu. Réessayez dans quelques secondes.";
  }
}

/**
 * Service HTTP générique avec gestion des tokens JWT.
 * Le timeout et le message d'erreur s'adaptent automatiquement au type d'endpoint.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const category = classifyEndpoint(endpoint);
  const timeoutDuration = TIMEOUT_MS[category];
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
  
  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    
    if (!response.ok) {
      const serverMsg = data.message || data.error || "";

      // LOG INTERNE — le développeur voit le détail dans la console
      console.error(`[api.js] HTTP ${response.status} sur ${endpoint} :`, serverMsg);
      
      // MESSAGES UTILISATEUR — adaptés au code HTTP, sans jargon
      if (response.status === 409 || serverMsg.includes("déjà enregistré") || serverMsg.includes("déjà inscrit") || serverMsg.includes("déjà utilisée")) {
        throw new Error("Cette adresse email est déjà utilisée. Connectez-vous ou utilisez une autre adresse.");
      }
      if (response.status === 401 || serverMsg.includes("invalides") || serverMsg.includes("incorrect")) {
        throw new Error("Email ou mot de passe incorrect.");
      }
      if (response.status === 400) {
        throw new Error("Vérifiez le format de votre email et que le mot de passe fait au moins 6 caractères.");
      }

      // Si le backend a déjà envoyé un message UX-friendly (via toUserMessage),
      // on le relaye tel quel plutôt que de le masquer
      if (serverMsg && serverMsg.startsWith("Oups")) {
        throw new Error(serverMsg);
      }

      // Fallback — message générique sans fuite technique
      throw new Error(serverMsg || "Oups, quelque chose s'est mal passé. Réessayez dans quelques instants.");
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Timeout explicite (AbortController) → MESSAGE UTILISATEUR contextuel
    if (error.name === "AbortError") {
      throw new Error(buildTimeoutMessage(category));
    }

    // Erreur réseau brute (backend totalement injoignable) → MESSAGE UTILISATEUR
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet et réessayez.");
    }

    // Conserver les erreurs déjà formatées par les blocs ci-dessus
    if (error.message) {
      throw error;
    }

    // Dernier recours → MESSAGE UTILISATEUR sans fuite technique
    throw new Error("Oups, une erreur inattendue s'est produite. Réessayez.");
  }
}

export const apiService = {
  // Authentification
  login: (username, password) => {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: username, password }),
    });
  },
  
  register: (username, password) => {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: username, password }),
    });
  },
  
  getProfile: () => {
    return request("/api/auth/profile", {
      method: "GET",
    });
  },
  
  // Analyses / Prédictions
  analyzeMatch: (matchUrl) => {
    return request("/api/predictions/analyser", {
      method: "POST",
      body: JSON.stringify({ matchUrl }),
    });
  },

  analyzeMatchStream: async (matchUrl, onProgress, onResult, onError) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/predictions/analyser`, {
        method: "POST",
        headers,
        body: JSON.stringify({ matchUrl, stream: true })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // LOG INTERNE
        console.error("[api.js] Erreur stream HTTP :", response.status, errorData);
        // MESSAGE UTILISATEUR — relaye le message UX du backend ou fallback
        const serverMsg = errorData.error || errorData.message || "";
        throw new Error(serverMsg || "Oups, le serveur a rencontré un problème. Réessayez.");
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Conserver la dernière ligne potentiellement incomplète
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "status") {
              onProgress(data);
            } else if (data.type === "result") {
              onResult(data.prediction);
            } else if (data.type === "error") {
              // Le backend a déjà traduit via toUserMessage — on relaye tel quel
              onError(new Error(data.message));
            }
          } catch (parseErr) {
            // LOG INTERNE uniquement
            console.error("[api.js] Erreur parsing ligne stream :", parseErr, line);
          }
        }
      }
    } catch (error) {
      onError(error);
    }
  },
  
  getHistory: () => {
    return request("/api/predictions/history", {
      method: "GET",
    });
  },
  
  deleteHistoryItem: (id) => {
    return request(`/api/predictions/history/${id}`, {
      method: "DELETE",
    });
  }
};
