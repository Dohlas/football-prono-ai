/**
 * AvatarCircles — Preuve sociale visuelle (utilisateurs actifs).
 *
 * Props :
 *   avatarUrls : string[]  — URLs des avatars à afficher
 *   numPeople  : number    — Nombre supplémentaire affiché dans le dernier cercle (+N)
 *   className  : string    — Classes CSS optionnelles à ajouter au conteneur
 *
 * Invariant : avatarUrls doit contenir au moins 1 élément.
 * Le composant est adapté au design system existant (vanilla CSS, pas de Tailwind).
 */
import React from "react";

const AvatarCircles = ({ numPeople = 0, avatarUrls = [], className = "" }) => {
  return (
    <div className={`avatar-circles ${className}`}>
      {avatarUrls.map((url, index) => (
        <img
          key={index}
          className="avatar-circle-img"
          src={url}
          width={40}
          height={40}
          alt={`Utilisateur ${index + 1}`}
          loading="lazy"
        />
      ))}
      {numPeople > 0 && (
        <span className="avatar-circle-count" aria-label={`${numPeople} utilisateurs supplémentaires`}>
          +{numPeople}
        </span>
      )}
    </div>
  );
};

export { AvatarCircles };
