import React, { useState, useEffect, useCallback } from 'react';
import { getTeamLogo, getFallbackAvatar } from '../utils/teamLogoResolver';

/**
 * Composant d'affichage du logo d'une équipe avec chaîne de fallback robuste :
 * 1. Dictionnaire local (Wikimedia / URL statique)
 * 2. TheSportsDB API (recherche dynamique)
 * 3. Avatar générique stylisé (ui-avatars)
 *
 * Le handler onError attrape les images cassées (CORS, 403, 404)
 * et déclenche automatiquement le niveau de fallback suivant.
 */
export default function TeamLogo({ teamName, size = 60, style = {}, alt = '' }) {
  const avatar = getFallbackAvatar(teamName);
  const [logoUrl, setLogoUrl] = useState(avatar);
  const [fallbackStage, setFallbackStage] = useState(0);
  // 0 = dictionnaire local, 1 = TheSportsDB, 2 = avatar générique

  /**
   * Tente de résoudre le logo via TheSportsDB.
   * Retourne l'URL du badge ou null si introuvable.
   */
  const fetchFromSportsDB = useCallback(async (name) => {
    if (!name) return null;
    try {
      const searchQuery = encodeURIComponent(name);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${searchQuery}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data?.teams?.length > 0) {
        const team = data.teams.find(t => t.strBadge);
        if (team?.strBadge) return team.strBadge;
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Erreur résolution logo TheSportsDB pour', name, e);
      }
    }
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const resolve = async () => {
      // Stage 0 : dictionnaire local
      const staticUrl = getTeamLogo(teamName);
      const isStaticReal = staticUrl && !staticUrl.includes('ui-avatars.com');

      if (isStaticReal) {
        if (isMounted) {
          setLogoUrl(staticUrl);
          setFallbackStage(0);
        }
        return;
      }

      // Pas dans le dictionnaire → passer directement à TheSportsDB
      if (isMounted) {
        setLogoUrl(avatar);
        setFallbackStage(1);
      }

      const sportsDbUrl = await fetchFromSportsDB(teamName);
      if (isMounted) {
        if (sportsDbUrl) {
          setLogoUrl(sportsDbUrl);
          setFallbackStage(1);
        } else {
          setLogoUrl(avatar);
          setFallbackStage(2);
        }
      }
    };

    resolve();

    return () => {
      isMounted = false;
    };
  }, [teamName, avatar, fetchFromSportsDB]);

  /**
   * Handler onError : quand une image échoue (CORS, 403, hotlink bloqué),
   * on passe au niveau de fallback suivant.
   */
  const handleImageError = useCallback(async () => {
    if (fallbackStage === 0) {
      // L'image statique a échoué → tenter TheSportsDB
      setFallbackStage(1);
      setLogoUrl(avatar); // placeholder immédiat

      const sportsDbUrl = await fetchFromSportsDB(teamName);
      if (sportsDbUrl) {
        setLogoUrl(sportsDbUrl);
      } else {
        setFallbackStage(2);
        setLogoUrl(avatar);
      }
    } else if (fallbackStage === 1) {
      // TheSportsDB a aussi échoué → avatar générique
      setFallbackStage(2);
      setLogoUrl(avatar);
    }
    // Stage 2 (avatar) : pas de fallback supplémentaire
  }, [fallbackStage, avatar, teamName, fetchFromSportsDB]);

  return (
    <img
      src={logoUrl}
      alt={alt || teamName}
      onError={handleImageError}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        ...style
      }}
    />
  );
}
