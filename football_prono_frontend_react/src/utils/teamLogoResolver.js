/**
 * Module de résolution de logos d'équipes (V2.0)
 *
 * Résout le logo actuel et officiel d'une équipe de football.
 * Fonctionnement :
 * 1. Normalisation du nom (accents, apostrophes, variantes).
 * 2. Vérification dans un dictionnaire local (TheSportsDB, source fiable sans CORS).
 * 3. Fallback vers un avatar générique neutre si l'équipe n'est pas dans le dictionnaire.
 *
 * V2 : Correction du bug CORS/hotlink Wikimedia — migration vers TheSportsDB badges.
 *       Ajout de la normalisation Unicode (accents) et des apostrophes typographiques.
 */

// Mapping des logos officiels — source TheSportsDB (pas de CORS, URLs stables)
const TOP_CLUBS_LOGOS = {
  // France
  'psg': 'https://www.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png',
  'marseille': 'https://www.thesportsdb.com/images/media/team/badge/yvwtpq1473504472.png',
  'lyon': 'https://www.thesportsdb.com/images/media/team/badge/xrxyxr1421400560.png',
  'monaco': 'https://www.thesportsdb.com/images/media/team/badge/819x2x1547281809.png',
  'lille': 'https://www.thesportsdb.com/images/media/team/badge/2giinf1534175962.png',
  'lens': 'https://www.thesportsdb.com/images/media/team/badge/t8e2ib1597063147.png',
  'rennes': 'https://www.thesportsdb.com/images/media/team/badge/ypwvxy1473504827.png',

  // Angleterre
  'arsenal': 'https://www.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png',
  'manchester city': 'https://www.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png',
  'liverpool': 'https://www.thesportsdb.com/images/media/team/badge/uvxuqq1448813372.png',
  'manchester united': 'https://www.thesportsdb.com/images/media/team/badge/xzqdr11517660252.png',
  'chelsea': 'https://www.thesportsdb.com/images/media/team/badge/yvwvtu1448813215.png',
  'tottenham': 'https://www.thesportsdb.com/images/media/team/badge/wfe1pv1604137704.png',
  'newcastle': 'https://www.thesportsdb.com/images/media/team/badge/2wsu1z1534012789.png',

  // Espagne
  'real madrid': 'https://www.thesportsdb.com/images/media/team/badge/vr67ah1511020460.png',
  'barcelona': 'https://www.thesportsdb.com/images/media/team/badge/ch4em91691764556.png',
  'atletico madrid': 'https://www.thesportsdb.com/images/media/team/badge/jaqwos1711878429.png',
  'sevilla': 'https://www.thesportsdb.com/images/media/team/badge/yrxrrx1420751903.png',

  // Italie
  'juventus': 'https://www.thesportsdb.com/images/media/team/badge/dd6e3k1547281930.png',
  'inter': 'https://www.thesportsdb.com/images/media/team/badge/wqutut1614191397.png',
  'ac milan': 'https://www.thesportsdb.com/images/media/team/badge/xutwtv1420400271.png',
  'napoli': 'https://www.thesportsdb.com/images/media/team/badge/txtuws1421838498.png',
  'roma': 'https://www.thesportsdb.com/images/media/team/badge/yvssqq1448813153.png',

  // Allemagne
  'bayern munich': 'https://www.thesportsdb.com/images/media/team/badge/rfsf6h1502212748.png',
  'dortmund': 'https://www.thesportsdb.com/images/media/team/badge/yrvpsy1421404060.png',
  'bayer leverkusen': 'https://www.thesportsdb.com/images/media/team/badge/mxig4h1551800693.png',
  'rb leipzig': 'https://www.thesportsdb.com/images/media/team/badge/gvoy2x1510231766.png',

  // Sélections Nationales — drapeaux via flagcdn (fiable, pas de CORS)
  'allemagne': 'https://flagcdn.com/w160/de.png',
  'france': 'https://flagcdn.com/w160/fr.png',
  'espagne': 'https://flagcdn.com/w160/es.png',
  'italie': 'https://flagcdn.com/w160/it.png',
  'angleterre': 'https://flagcdn.com/w160/gb-eng.png',
  'bresil': 'https://flagcdn.com/w160/br.png',
  'argentine': 'https://flagcdn.com/w160/ar.png',
  'portugal': 'https://flagcdn.com/w160/pt.png',
  'belgique': 'https://flagcdn.com/w160/be.png',
  'pays-bas': 'https://flagcdn.com/w160/nl.png',
  'cote d\'ivoire': 'https://flagcdn.com/w160/ci.png',
  'senegal': 'https://flagcdn.com/w160/sn.png',
  'cameroun': 'https://flagcdn.com/w160/cm.png',
  'maroc': 'https://flagcdn.com/w160/ma.png',
  'tunisie': 'https://flagcdn.com/w160/tn.png',
  'algerie': 'https://flagcdn.com/w160/dz.png',
  'nigeria': 'https://flagcdn.com/w160/ng.png',
  'egypte': 'https://flagcdn.com/w160/eg.png',
  'japon': 'https://flagcdn.com/w160/jp.png',
  'coree du sud': 'https://flagcdn.com/w160/kr.png',
  'etats-unis': 'https://flagcdn.com/w160/us.png',
  'mexique': 'https://flagcdn.com/w160/mx.png',
  'colombie': 'https://flagcdn.com/w160/co.png',
  'uruguay': 'https://flagcdn.com/w160/uy.png',
  'croatie': 'https://flagcdn.com/w160/hr.png',
  'suisse': 'https://flagcdn.com/w160/ch.png',
  'pologne': 'https://flagcdn.com/w160/pl.png',
  'turquie': 'https://flagcdn.com/w160/tr.png',
  'autriche': 'https://flagcdn.com/w160/at.png',
  'danemark': 'https://flagcdn.com/w160/dk.png',
  'suede': 'https://flagcdn.com/w160/se.png',
  'norvege': 'https://flagcdn.com/w160/no.png',
  'ecosse': 'https://flagcdn.com/w160/gb-sct.png',
  'pays de galles': 'https://flagcdn.com/w160/gb-wls.png',
  'ghana': 'https://flagcdn.com/w160/gh.png',
  'mali': 'https://flagcdn.com/w160/ml.png'
};

// Aliases : toutes les variantes de noms (y compris avec accents) vers la clé normalisée
const TEAM_ALIASES = {
  // Sélections nationales
  'germany': 'allemagne',
  'deutschland': 'allemagne',
  'ivory coast': 'cote d\'ivoire',
  'costa de marfil': 'cote d\'ivoire',
  'spain': 'espagne',
  'italy': 'italie',
  'england': 'angleterre',
  'brazil': 'bresil',
  'argentina': 'argentine',
  'belgium': 'belgique',
  'netherlands': 'pays-bas',
  'holland': 'pays-bas',
  'south korea': 'coree du sud',
  'united states': 'etats-unis',
  'usa': 'etats-unis',
  'croatia': 'croatie',
  'switzerland': 'suisse',
  'poland': 'pologne',
  'turkey': 'turquie',
  'austria': 'autriche',
  'denmark': 'danemark',
  'sweden': 'suede',
  'norway': 'norvege',
  'scotland': 'ecosse',
  'wales': 'pays de galles',
  'morocco': 'maroc',
  'tunisia': 'tunisie',
  'algeria': 'algerie',
  'egypt': 'egypte',
  'japan': 'japon',
  'colombia': 'colombie',
  'mexico': 'mexique',
  'cameroon': 'cameroun',

  // Clubs
  'paris sg': 'psg',
  'paris saint germain': 'psg',
  'paris saint-germain': 'psg',
  'om': 'marseille',
  'olympique de marseille': 'marseille',
  'ol': 'lyon',
  'olympique lyonnais': 'lyon',
  'asm': 'monaco',
  'as monaco': 'monaco',
  'losc': 'lille',
  'losc lille': 'lille',
  'rcl': 'lens',
  'racing club de lens': 'lens',
  'stade rennais': 'rennes',

  'man utd': 'manchester united',
  'man united': 'manchester united',
  'mufc': 'manchester united',
  'man city': 'manchester city',
  'mcfc': 'manchester city',
  'spurs': 'tottenham',
  'tottenham hotspur': 'tottenham',
  'newcastle united': 'newcastle',

  'real': 'real madrid',
  'real madrid cf': 'real madrid',
  'barca': 'barcelona',
  'fc barcelona': 'barcelona',
  'barcelone': 'barcelona',
  'fc barcelone': 'barcelona',
  'atletico': 'atletico madrid',
  'atletico de madrid': 'atletico madrid',
  'fc sevilla': 'sevilla',
  'seville': 'sevilla',

  'juve': 'juventus',
  'juventus fc': 'juventus',
  'inter milan': 'inter',
  'internazionale': 'inter',
  'milan ac': 'ac milan',
  'milan': 'ac milan',
  'ssc napoli': 'napoli',
  'as roma': 'roma',

  'bayern': 'bayern munich',
  'fc bayern munich': 'bayern munich',
  'fc bayern munchen': 'bayern munich',
  'bvb': 'dortmund',
  'borussia dortmund': 'dortmund',
  'leverkusen': 'bayer leverkusen',
  'leipzig': 'rb leipzig'
};

// Cache mémoire pour éviter les recalculs
const memoryCache = new Map();

/**
 * Supprime les diacritiques (accents) d'une chaîne.
 * "Côte d'Ivoire" → "Cote d'Ivoire"
 * "München" → "Munchen"
 *
 * Invariant : retourne toujours une chaîne (vide si input vide).
 */
function removeDiacritics(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalise les apostrophes typographiques (', ʼ, `) vers l'apostrophe droite standard (').
 *
 * Invariant : retourne toujours une chaîne.
 */
function normalizeApostrophes(str) {
  if (!str) return '';
  return str.replace(/[\u2018\u2019\u201A\u201B\u0060\u02BC\u2032]/g, "'");
}

/**
 * Nettoie et normalise le nom de l'équipe pour le matching.
 * Pipeline : lowercase → apostrophes → accents → préfixes clubs → multi-espaces.
 *
 * Invariant : retourne toujours une chaîne non-vide si l'input est non-vide.
 */
function normalizeName(name) {
  if (!name) return '';
  let clean = name.toLowerCase().trim();
  clean = normalizeApostrophes(clean);
  clean = removeDiacritics(clean);
  // Retirer les préfixes/suffixes de clubs courants
  clean = clean.replace(/\b(fc|cf|sc)\b/g, '').trim();
  // Compacter les espaces multiples
  clean = clean.replace(/\s+/g, ' ');
  return clean;
}

/**
 * Génère l'URL d'un avatar générique stylisé pour l'équipe.
 * @param {string} teamName - Nom brut de l'équipe.
 * @returns {string} URL ui-avatars
 */
export function getFallbackAvatar(teamName) {
  if (!teamName) return '';
  const shortName = encodeURIComponent(teamName.substring(0, 3));
  return `https://ui-avatars.com/api/?name=${shortName}&background=1e2330&color=ccff00&bold=true&font-size=0.4&size=128`;
}

/**
 * Obtient l'URL du logo officiel de l'équipe (synchrone).
 * @param {string} teamName - Le nom brut de l'équipe.
 * @returns {string} URL de l'image (PNG) ou avatar fallback
 *
 * Invariant : retourne toujours une chaîne non-vide si teamName est non-vide.
 */
export function getTeamLogo(teamName) {
  if (!teamName) return '';

  const cacheKey = teamName.toLowerCase().trim();
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // 1. Normalisation agressive (accents, apostrophes, préfixes)
  const normalized = normalizeName(teamName);

  // 2. Essayer dans cet ordre : nom brut lowercase → normalisé → alias du brut → alias du normalisé
  const candidates = [cacheKey, normalized];
  let resolvedKey = null;

  for (const candidate of candidates) {
    if (TOP_CLUBS_LOGOS[candidate]) {
      resolvedKey = candidate;
      break;
    }
    const aliasTarget = TEAM_ALIASES[candidate];
    if (aliasTarget && TOP_CLUBS_LOGOS[aliasTarget]) {
      resolvedKey = aliasTarget;
      break;
    }
  }

  let logoUrl;
  if (resolvedKey) {
    logoUrl = TOP_CLUBS_LOGOS[resolvedKey];
  } else {
    logoUrl = getFallbackAvatar(teamName);
  }

  memoryCache.set(cacheKey, logoUrl);
  return logoUrl;
}
