/**
 * DONJON INFINI — Création d'aventurier (§6).
 * 100 points distribués aléatoirement dans les fourchettes de la race ;
 * les stats non listées restent à 0. Ressources dérivées des pools de race
 * et des conversions §5.1. Les PV persistent hors combat (pas de régén
 * passive, §5.7) ; Mana/END récupèrent en 5 tours de déplacement.
 */
function createAdventurer(rng, cfg, raceKey = null) {
  const key = raceKey || rng.pick(Object.keys(RACES));
  const race = RACES[key];
  const stats = {};
  for (const k of STAT_KEYS) stats[k] = 0;
  Object.assign(stats, distributePoints(rng, race.ranges, cfg.ADVENTURER_CREATION_POINTS));

  const C = cfg.COMBAT;
  const pvMax = race.pools.pv + stats.constitution * C.PV_PER_CON;
  const manaMax = race.pools.mana + stats.mana * C.MANA_PER_POINT;
  const endMax = race.pools.endurance + stats.endurance * C.END_PER_POINT;
  return {
    name: 'Aventurier',
    side: 'aventuriers',
    raceKey: key,
    raceLabel: race.label,
    niveau: 1, // système de progression : À TRANCHER (§14.13)
    stats,
    pvMax, pv: pvMax,
    manaMax, mana: manaMax,
    endMax, end: endMax,
  };
}

if (typeof module !== 'undefined') module.exports = { createAdventurer };
