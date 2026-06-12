/**
 * DONJON INFINI — Configuration (data-driven, §0.3 de la spec).
 * Toutes les valeurs numériques du jeu vivent ici, jamais dans la logique moteur.
 */
const CONFIG = {
  // §3.1 — L'échiquier
  GRID_SIZE: 10,                 // grille 10×10
  PLAYABLE_COUNT: 70,            // salles jouables
  UNPLAYABLE_COUNT: 30,          // cases injouables
  UNPLAYABLE_GROUP_MIN: 1,       // groupes de cases injouables contiguës : taille min
  UNPLAYABLE_GROUP_MAX: 5,       // taille max d'un bloc contigu de cases injouables
  UNPLAYABLE_MAX_NEIGHBORS: 3,   // max de voisins injouables directs par case injouable
  MAZE_MAX_DEGREE: 3,            // chaque salle reliée à 1, 2 ou 3 salles adjacentes
  ACCESS_MIN_PATH: 5,            // distance min (salles parcourues) entre les deux accès

  // §3.2 — Répartition des salles dynamiques par étage (quota fixe du pool)
  ROOMS_NORMAL: { monstre: 30, vide: 30, tresor: 3 },  // étage normal (+ 5 pièges + 2 accès)
  ROOMS_VILLE: { monstre: 29, vide: 30, tresor: 3 },   // étage ×5 (+ 5 pièges + 2 accès + 1 ville)
  PIEGES_PER_FLOOR: 5,           // salles pièges, fixes (§3.3)
  VILLE_EVERY: 5,                // ville/village tous les 5 étages (§3.6)

  // §3.4 — Respawn
  RESPAWN_ROOM_TOURS: 100,       // compteur individuel par salle
  RESPAWN_BOSS_TOURS: 300,       // boss (utilisé au jalon M9)

  // Génération — bornes de retry (techniques, pas du design)
  GENERATION_MAX_ATTEMPTS: 200,  // tentatives de génération complète d'un étage
  GROUP_PLACEMENT_TRIES: 40,     // tentatives de placement d'un bloc injouable
};

if (typeof module !== 'undefined') module.exports = { CONFIG };
