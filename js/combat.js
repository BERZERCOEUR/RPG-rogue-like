/**
 * DONJON INFINI — Moteur de combat ATB (§5.6), sans DOM : utilisé par l'UI
 * et par le simulateur headless.
 *
 * ATB : jauges 0→100, positions initiales aléatoires entre 0 et 40, celui
 * qui atteint 100 joue puis repart à 0. Implémentation en temps continu :
 * on avance toutes les jauges proportionnellement à la Vitesse effective
 * jusqu'à ce que la première atteigne 100. Dans le cas nominal cela
 * reproduit exactement « les autres avancent de (leur VIT / VIT de
 * l'acteur) × 100 », et cela évite les débordements de jauge quand
 * plusieurs participants franchiraient 100 en même temps [décision M3].
 *
 * Clamp 2:1 [RÉVISION 2026] : la Vitesse effective est plafonnée à
 * 2 × la VIT du participant vivant le plus lent — la VIT excédentaire
 * n'apporte plus rien.
 *
 * §3.5 : chaque activation d'un participant compte 1 tour (le moteur
 * notifie via onActivation, branché sur Game.advanceTours par l'UI).
 */
class CombatEngine {
  constructor(aventuriers, monstres, rng, cfg) {
    this.rng = rng;
    this.cfg = cfg;
    this.aventuriers = aventuriers;
    this.monstres = monstres;
    for (const p of this.all()) {
      p.gauge = rng.int(0, cfg.COMBAT.ATB_START_MAX);
    }
  }

  all() {
    return [...this.aventuriers, ...this.monstres];
  }

  living(list) {
    return list.filter((p) => p.pv > 0);
  }

  /** Vitesse effective : clamp de fréquence 2:1 entre vivants (§5.6). */
  effectiveVit(p, livingAll) {
    const vmin = Math.max(1, Math.min(...livingAll.map((x) => Math.max(1, x.stats.vitesse))));
    return Math.min(Math.max(1, p.stats.vitesse), vmin * this.cfg.COMBAT.ATB_SPEED_RATIO_CLAMP);
  }

  /**
   * Avance le temps jusqu'à ce qu'une jauge atteigne 100 et retourne
   * l'acteur (égalité départagée au hasard). Sa jauge sera remise à 0 par
   * endTurn() après son action.
   */
  nextActor() {
    const livingAll = this.living(this.all());
    if (!livingAll.length) return null;
    const max = this.cfg.COMBAT.ATB_MAX;
    let dt = Infinity;
    for (const p of livingAll) {
      dt = Math.min(dt, (max - p.gauge) / this.effectiveVit(p, livingAll));
    }
    const ready = [];
    for (const p of livingAll) {
      p.gauge = Math.min(max, p.gauge + this.effectiveVit(p, livingAll) * dt);
      if (p.gauge >= max - 1e-9) ready.push(p);
    }
    return ready.length === 1 ? ready[0] : this.rng.pick(ready);
  }

  endTurn(actor) {
    actor.gauge = 0;
  }

  /**
   * Attaque de base (§5.2) : physique, dégâts bruts = Force (1 pt = 1 dégât).
   * Applique les dégâts et retourne { touche, crit, degats, mort }.
   */
  basicAttack(attacker, defender) {
    const raw = attacker.stats.force;
    const res = resolveAttack(attacker, defender, raw, false, this.rng, this.cfg.COMBAT);
    if (res.touche) {
      defender.pv = Math.max(0, defender.pv - res.degats);
    }
    return { ...res, mort: defender.pv === 0 };
  }

  /** 'victoire' (monstres morts), 'defaite' (aventuriers morts) ou null. */
  result() {
    if (!this.living(this.monstres).length) return 'victoire';
    if (!this.living(this.aventuriers).length) return 'defaite';
    return null;
  }
}

if (typeof module !== 'undefined') module.exports = { CombatEngine };
