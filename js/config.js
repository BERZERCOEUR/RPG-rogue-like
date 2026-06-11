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

  // Génération — bornes de retry (techniques, pas du design)
  GENERATION_MAX_ATTEMPTS: 200,  // tentatives de génération complète d'un étage
  GROUP_PLACEMENT_TRIES: 40,     // tentatives de placement d'un bloc injouable
};

if (typeof module !== 'undefined') module.exports = { CONFIG };
