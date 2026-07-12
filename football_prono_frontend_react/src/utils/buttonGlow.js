/**
 * buttonGlow.js — Mouse-following glow effect on all buttons.
 *
 * Technique : event delegation sur document.
 * Pour chaque bouton ciblé (.btn-neon, .btn-outline), on met à jour
 * les propriétés CSS custom `--mx` et `--my` avec la position de la
 * souris relative au bouton. Le ::before CSS utilise ces valeurs comme
 * centre du radial-gradient.
 *
 * Invariant : la fonction init() ne doit être appelée qu'une seule fois.
 * Retourne une fonction cleanup() à appeler lors du démontage.
 */

/** Sélecteur unique couvrant tous les types de boutons du design system. */
const BTN_SELECTOR = ".btn-neon, .btn-outline";

/** Référence au handler, stockée pour permettre le cleanup. */
let _handler = null;

/**
 * Initialise l'effet glow sur tous les boutons.
 * @returns {() => void} Fonction de nettoyage à appeler au démontage.
 */
export function initButtonGlow() {
  // Précondition : ne pas enregistrer deux fois le même listener.
  if (_handler !== null) return () => {};

  /**
   * Handler unique par délégation.
   * Recherche le bouton le plus proche dans la hiérarchie DOM
   * et met à jour ses variables CSS.
   *
   * @param {MouseEvent} e
   */
  function handleMouseMove(e) {
    const btn = e.target.closest(BTN_SELECTOR);
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Mise à jour des custom properties CSS (lecture directe par le ::before)
    btn.style.setProperty("--mx", `${x}px`);
    btn.style.setProperty("--my", `${y}px`);
  }

  _handler = handleMouseMove;
  document.addEventListener("mousemove", _handler, { passive: true });

  /**
   * Cleanup : retire le listener et réinitialise la référence.
   * Postcondition : _handler est null après l'appel.
   */
  return function cleanup() {
    if (_handler) {
      document.removeEventListener("mousemove", _handler);
      _handler = null;
    }
  };
}
