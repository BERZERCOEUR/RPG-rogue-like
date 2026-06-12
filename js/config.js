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

  // §5 — Combat [RÉVISION 2026]
  COMBAT: {
    HIT_BASE: 15,                // base implicite des deux côtés du duel toucher (§5.3)
    HIT_MIN: 25,                 // bornes de la chance de toucher en %
    HIT_MAX: 95,
    MAGIC_DODGE_FACTOR: 0.5,     // Esquive comptée à 50% contre la magie (§5.3)
    CRIT_BASE: 30,               // dénominateur du duel critique (§5.4)
    CRIT_CAP: 50,                // plafond de chance de critique en %
    CRIT_MULT: 1.5,              // dégâts critiques = normaux × 1,5 + Dext × 0,5
    CRIT_DEX_COEFF: 0.5,
    RESIST_BASE: 50,             // Réduction % = Rés / (Rés + 50) (§5.5)
    MIN_DAMAGE: 1,               // plancher de dégâts sur un coup qui touche [décision M3]
    ATB_MAX: 100,                // jauge ATB (§5.6)
    ATB_START_MAX: 40,           // positions initiales aléatoires entre 0 et 40
    ATB_SPEED_RATIO_CLAMP: 2,    // clamp de fréquence 2:1 [RÉVISION 2026]
    PV_PER_CON: 5,               // 1 pt de Constitution = 5 PV (§5.1)
    END_PER_POINT: 3,            // 1 pt d'Endurance = 3 END
    MANA_PER_POINT: 3,           // 1 pt de Mana = 3 Mana
    REGEN_TOURS: 5,              // récupération complète Mana/END en 5 tours hors combat (§5.7)
  },

  // §6.1 — Création d'aventurier
  ADVENTURER_CREATION_POINTS: 100,

  // §7.4 — Scaling des monstres [RÉVISION 2026]
  MONSTER_RARITIES: {
    commun: { label: 'Commun', points: 60, pvPool: 30 },
    peuCommun: { label: 'Peu Commun', points: 90, pvPool: 50 },
    rare: { label: 'Rare', points: 130, pvPool: 100 },
    epique: { label: 'Épique', points: 180, pvPool: 200 },
    legendaire: { label: 'Légendaire', points: 250, pvPool: 350 },
    nomme: { label: 'Nommé', points: 350, pvPool: 600 },
  },
  CAMPAIGN_MULT_PER_FLOOR: 0.015,   // Mult = 1 + 0,015 × N (étages 1–100)
  ABYSS_START_FLOOR: 100,           // [VALEURS DE DÉPART] Abîme : 2,5 × 1,025^(N−100)
  ABYSS_MULT_BASE: 2.5,
  ABYSS_MULT_GROWTH: 1.025,
  GROUP_STAT_MOD: { 1: 1.0, 2: 0.70, 3: 0.55, 4: 0.45 }, // §7.4 modificateur de groupe
  ORIENTATION_MAIN_SHARE: 0.70,     // §7.1 règle universelle 70/30
  MONSTER_COUNT_TAU: 90,            // §7.6 Moyenne(N) = 1 + 2 × (1 − e^(−N/90))
  MONSTER_COUNT_MAX: 4,

  // Génération — bornes de retry (techniques, pas du design)
  GENERATION_MAX_ATTEMPTS: 200,  // tentatives de génération complète d'un étage
  GROUP_PLACEMENT_TRIES: 40,     // tentatives de placement d'un bloc injouable
};

if (typeof module !== 'undefined') module.exports = { CONFIG };
