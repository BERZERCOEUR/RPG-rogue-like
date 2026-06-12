/**
 * DONJON INFINI — État d'un étage (jalon M2).
 *
 * §3.2 : répartition des salles par quota fixe (30 monstres / 30 vides /
 * 3 trésors sur un étage normal ; 29 monstres sur un étage ×5).
 * Le type d'une salle dynamique n'est déterminé qu'au moment où le joueur
 * la traverse : il est tiré dans le pool restant de l'étage. Au respawn,
 * la salle rend son type au pool et repasse en brouillard (§3.4) — c'est
 * ainsi qu'elle « peut changer de type » tout en respectant le quota.
 *
 * §3.3 : accès et ville fixes (symbole permanent, jamais de respawn) ;
 * pièges fixes mais réarmés par le respawn ; monstres/vides/trésors
 * repositionnables.
 *
 * RNG : le layout de l'étage N dérive de `seed/etage/N/layout` — il est
 * identique quelle que soit la façon dont le joueur joue. Les tirages
 * dynamiques (types de salles) consomment un flux séparé.
 */
const DYNAMIC_TYPES = ['monstre', 'vide', 'tresor'];

class Floor {
  constructor(seed, number, cfg, entryCell) {
    this.number = number;
    this.cfg = cfg;
    const layoutRng = new RNG(`${seed}/etage/${number}/layout`);
    this.rng = new RNG(`${seed}/etage/${number}/dynamique`);
    const withVille = number % cfg.VILLE_EVERY === 0;
    this.layout = generateFloor(layoutRng, cfg, { entryCell, withVille });

    const n = cfg.GRID_SIZE * cfg.GRID_SIZE;
    this.type = new Array(n).fill(null);      // null = salle dynamique non déterminée
    this.explored = new Array(n).fill(false);
    this.lastTraverse = new Array(n).fill(null);
    this.vaincu = new Array(n).fill(false);   // salles monstres (combat : jalon M3)

    const L = this.layout;
    if (L.jaune !== null) this.type[L.jaune] = 'jaune';
    this.type[L.orange] = 'orange';
    if (L.ville !== null) this.type[L.ville] = 'ville';
    for (const p of L.pieges) this.type[p] = 'piege';

    // Pool dynamique de l'étage (quota fixe, §3.2/§3.4).
    // Étage 0 : pas de case jaune → la salle libérée devient une vide.
    this.pool = withVille ? { ...cfg.ROOMS_VILLE } : { ...cfg.ROOMS_NORMAL };
    if (L.jaune === null) this.pool.vide += 1;
  }

  /** Accès et ville : salles fixes à symbole permanent, jamais de respawn. */
  isPermanent(idx) {
    const t = this.type[idx];
    return t === 'orange' || t === 'jaune' || t === 'ville';
  }

  /** Tire un type dans le pool restant de l'étage, pondéré par les quotas. */
  drawType() {
    const avail = DYNAMIC_TYPES.filter((t) => this.pool[t] > 0);
    let r = this.rng.next() * avail.reduce((s, t) => s + this.pool[t], 0);
    for (const t of avail) {
      r -= this.pool[t];
      if (r < 0) {
        this.pool[t]--;
        return t;
      }
    }
    return avail[avail.length - 1]; // garde-fou arithmétique flottante
  }

  /** Traversée d'une salle : exploration, reset du compteur, tirage du type. */
  enter(idx, tour) {
    this.explored[idx] = true;
    this.lastTraverse[idx] = tour;
    if (this.type[idx] === null) this.type[idx] = this.drawType();
    return this.type[idx];
  }

  /**
   * Respawn (§3.4) : toute salle non traversée depuis RESPAWN_ROOM_TOURS
   * repasse en brouillard ; les types dynamiques retournent au pool, les
   * pièges sont réarmés. `skipIdx` protège la salle occupée par le joueur.
   * Les compteurs sont des numéros de tour absolus : l'appel peut être
   * différé (étage non visité) sans fausser le résultat.
   */
  processRespawns(tour, skipIdx = -1) {
    for (let i = 0; i < this.type.length; i++) {
      if (i === skipIdx || this.layout.unplayable[i] || this.isPermanent(i)) continue;
      if (this.lastTraverse[i] === null) continue;
      if (tour - this.lastTraverse[i] < this.cfg.RESPAWN_ROOM_TOURS) continue;
      this.explored[i] = false;
      this.lastTraverse[i] = null;
      this.vaincu[i] = false;
      const t = this.type[i];
      if (DYNAMIC_TYPES.includes(t)) {
        this.pool[t]++;
        this.type[i] = null;
      }
    }
  }

  exploredCount() {
    return this.explored.filter(Boolean).length;
  }
}

if (typeof module !== 'undefined') module.exports = { Floor, DYNAMIC_TYPES };
