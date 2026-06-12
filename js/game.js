/**
 * DONJON INFINI — État de jeu multi-étages (jalon M2).
 *
 * §3.6 : étage de départ 0 (Ville de départ explorée d'office) ; montée par
 * la case orange, descente par la case jaune, arrivée à la même coordonnée ;
 * la disposition de chaque étage est mémorisée (sous réserve du respawn).
 * §3.5 : 1 tour par déplacement (y compris monter/descendre un étage).
 * Le compteur de tours est global : il court pour tous les étages (§3.4).
 */
class Game {
  constructor(seed, cfg) {
    this.cfg = cfg;
    this.seed = String(seed);
    this.tour = 0;
    this.floors = new Map();
    this.etage = 0;
    const f0 = this.floor(0);
    this.pos = f0.layout.ville;
    f0.enter(this.pos, this.tour); // Ville de départ explorée d'office
  }

  /** Étage N, généré à la première visite et mémorisé ensuite (§3.6). */
  floor(n) {
    if (!this.floors.has(n)) {
      const entry = n === 0 ? null : this.floor(n - 1).layout.orange;
      this.floors.set(n, new Floor(this.seed, n, this.cfg, entry));
    }
    return this.floors.get(n);
  }

  current() {
    return this.floor(this.etage);
  }

  /** Avance le temps de `n` tours et applique le respawn sur l'étage courant. */
  advanceTours(n) {
    this.tour += n;
    this.current().processRespawns(this.tour, this.pos);
  }

  canMoveTo(idx) {
    return this.current().layout.passages[this.pos].includes(idx);
  }

  moveTo(idx) {
    if (!this.canMoveTo(idx)) return false;
    this.pos = idx;
    this.tour++;
    const floor = this.current();
    floor.processRespawns(this.tour, idx);
    floor.enter(idx, this.tour);
    return true;
  }

  moveDir(dx, dy) {
    const size = this.cfg.GRID_SIZE;
    const x = (this.pos % size) + dx;
    const y = Math.floor(this.pos / size) + dy;
    if (x < 0 || x >= size || y < 0 || y >= size) return false;
    return this.moveTo(y * size + x);
  }

  /** Contexte du bouton « Utiliser » (§13.3). */
  utiliserContext() {
    const t = this.current().type[this.pos];
    if (t === 'orange') return 'monter';
    if (t === 'jaune' && this.etage > 0) return 'descendre';
    if (t === 'ville') return 'entrer'; // intérieur de la ville : jalon M5
    return null;
  }

  utiliser() {
    const ctx = this.utiliserContext();
    if (ctx === 'monter') return this.changeFloor(this.etage + 1);
    if (ctx === 'descendre') return this.changeFloor(this.etage - 1);
    return false;
  }

  /** Monter/descendre : même coordonnée d'arrivée (§3.6), coûte 1 tour. */
  changeFloor(n) {
    const target = this.floor(n);
    this.etage = n;
    this.tour++;
    target.processRespawns(this.tour, this.pos);
    target.enter(this.pos, this.tour);
    return true;
  }
}

if (typeof module !== 'undefined') module.exports = { Game };
