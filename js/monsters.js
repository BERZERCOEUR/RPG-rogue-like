/**
 * DONJON INFINI — Monstres d'essai du jalon M3.
 *
 * PROVISOIRE M4 : seuls des monstres Communs d'orientation Offensif Physique
 * sont générés ici. Le jalon M4 apportera les 7 orientations, les raretés
 * (sigmoïdes §7.5), les hybrides, les familles du bestiaire et les
 * compositions de groupes (§7.7). Les mécaniques déjà conformes : règle
 * 70/30 (§7.1), fourchettes Offensif Physique (§7.2), scaling §7.4
 * (points × mult. étage × mod. groupe), nombre de monstres §7.6.
 */

// §7.2 — Orientation Offensif Physique : part des 70% en % du total X
const ORIENTATION_OFFENSIF_PHYSIQUE = {
  force: [21, 36], dexterite: [11, 26], vitesse: [7, 17],
  precPhys: [11, 26], precCritPhys: [11, 26],
  constitution: [4, 7], endurance: [4, 6],
};

/** §7.6 — Nombre de monstres : Moyenne(N) = 1 + 2 × (1 − e^(−N/τ)). */
function monsterCountForFloor(rng, cfg, etage) {
  const mean = 1 + 2 * (1 - Math.exp(-etage / cfg.MONSTER_COUNT_TAU));
  const base = Math.floor(mean);
  const count = base + (rng.next() < mean - base ? 1 : 0);
  return Math.max(1, Math.min(cfg.MONSTER_COUNT_MAX, count));
}

/** §7.1/§7.4 — Stats d'un monstre : 70% orientation (fourchettes en % de X), 30% libres. */
function rollMonsterStats(rng, cfg, totalPoints) {
  const stats = {};
  for (const k of STAT_KEYS) stats[k] = 0;

  const points70 = Math.round(cfg.ORIENTATION_MAIN_SHARE * totalPoints);
  const ranges = {};
  for (const [k, [lo, hi]] of Object.entries(ORIENTATION_OFFENSIF_PHYSIQUE)) {
    ranges[k] = [Math.floor((lo / 100) * totalPoints), Math.ceil((hi / 100) * totalPoints)];
  }
  Object.assign(stats, distributePoints(rng, ranges, points70));

  for (let p = points70; p < totalPoints; p++) stats[rng.pick(STAT_KEYS)]++; // 30% libres
  return stats;
}

/**
 * Génère le groupe de monstres d'une salle (jalon M3 : Communs uniquement).
 * Stats finales = points_rareté × mult_étage × mod_groupe (§7.4), le pool
 * de PV suit le même scaling [interprétation à valider, cf. README].
 */
function generateMonsterGroup(rng, cfg, etage) {
  const count = monsterCountForFloor(rng, cfg, etage);
  const mod = cfg.GROUP_STAT_MOD[count];
  const mult = floorMultiplier(etage, cfg);
  const rarity = cfg.MONSTER_RARITIES.commun;
  const totalPoints = Math.max(1, Math.round(rarity.points * mult * mod));
  const pvPool = Math.round(rarity.pvPool * mult * mod);
  const C = cfg.COMBAT;
  const letters = ['A', 'B', 'C', 'D'];

  return Array.from({ length: count }, (_, i) => {
    const stats = rollMonsterStats(rng, cfg, totalPoints);
    const pvMax = pvPool + stats.constitution * C.PV_PER_CON;
    return {
      name: count > 1 ? `Rat géant ${letters[i]}` : 'Rat géant',
      side: 'monstres',
      famille: 'Bête',
      rarete: rarity.label,
      etage,
      stats,
      pvMax, pv: pvMax,
      manaMax: stats.mana * C.MANA_PER_POINT, mana: stats.mana * C.MANA_PER_POINT,
      endMax: stats.endurance * C.END_PER_POINT, end: stats.endurance * C.END_PER_POINT,
    };
  });
}

if (typeof module !== 'undefined') {
  module.exports = { generateMonsterGroup, monsterCountForFloor, rollMonsterStats, ORIENTATION_OFFENSIF_PHYSIQUE };
}
