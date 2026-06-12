/**
 * DONJON INFINI — Formules de combat (§5, RÉVISION 2026) et utilitaires de
 * distribution de points de stats. Fonctions pures : utilisées à l'identique
 * par l'UI navigateur et les simulations headless.
 */

/** §5.3 — Chance de toucher %, bornée [25 ; 95]. */
function hitChance(prec, esquive, isMagic, C) {
  const eff = esquive * (isMagic ? C.MAGIC_DODGE_FACTOR : 1);
  const pct = ((prec + C.HIT_BASE) / (prec + C.HIT_BASE + eff + C.HIT_BASE)) * 100;
  return Math.min(C.HIT_MAX, Math.max(C.HIT_MIN, pct));
}

/** §5.4 — Chance de critique %, plafonnée à 50. */
function critChance(precCrit, resCrit, C) {
  const pct = (precCrit / (precCrit + resCrit + C.CRIT_BASE)) * 100;
  return Math.min(C.CRIT_CAP, pct);
}

/** §5.4 — Dégâts critiques = normaux × 1,5 + Dextérité × 0,5. */
function critDamage(normal, dexterite, C) {
  return normal * C.CRIT_MULT + dexterite * C.CRIT_DEX_COEFF;
}

/** §5.5 — Réduction de dégâts (0..1) par la résistance. */
function resistReduction(res, C) {
  return res / (res + C.RESIST_BASE);
}

/**
 * §5.2 — Séquence de résolution d'une attaque (toucher → critique →
 * résistance → dégâts). `raw` = dégâts bruts (Force ou Intelligence pour
 * l'attaque de base). Retourne { touche, crit, degats }.
 */
function resolveAttack(attacker, defender, raw, isMagic, rng, C) {
  const prec = isMagic ? attacker.stats.precMag : attacker.stats.precPhys;
  if (rng.next() * 100 >= hitChance(prec, defender.stats.esquive, isMagic, C)) {
    return { touche: false, crit: false, degats: 0 };
  }
  const pc = isMagic ? attacker.stats.precCritMag : attacker.stats.precCritPhys;
  const rc = isMagic ? defender.stats.resCritMag : defender.stats.resCritPhys;
  const crit = rng.next() * 100 < critChance(pc, rc, C);
  let degats = crit ? critDamage(raw, attacker.stats.dexterite, C) : raw;
  const res = isMagic ? defender.stats.resMag : defender.stats.resPhys;
  degats = Math.max(C.MIN_DAMAGE, Math.round(degats * (1 - resistReduction(res, C))));
  return { touche: true, crit, degats };
}

/**
 * Distribution aléatoire de points entiers dans des fourchettes min/max
 * (création d'aventurier §6.1, répartition des monstres §7.2).
 * Chaque stat démarre à son min ; les points restants sont ajoutés un à un
 * sur une stat tirée au hasard parmi celles sous leur max.
 */
function distributePoints(rng, ranges, total) {
  const out = {};
  let used = 0;
  for (const [key, [min]] of Object.entries(ranges)) {
    out[key] = min;
    used += min;
  }
  for (let p = used; p < total; p++) {
    const open = Object.keys(ranges).filter((k) => out[k] < ranges[k][1]);
    if (!open.length) break;
    out[rng.pick(open)]++;
  }
  return out;
}

/** §7.4 — Multiplicateur d'étage [RÉVISION 2026] : campagne puis Abîme. */
function floorMultiplier(n, cfg) {
  if (n <= cfg.ABYSS_START_FLOOR) return 1 + cfg.CAMPAIGN_MULT_PER_FLOOR * n;
  return cfg.ABYSS_MULT_BASE * Math.pow(cfg.ABYSS_MULT_GROWTH, n - cfg.ABYSS_START_FLOOR);
}

if (typeof module !== 'undefined') {
  module.exports = {
    hitChance, critChance, critDamage, resistReduction, resolveAttack,
    distributePoints, floorMultiplier,
  };
}
