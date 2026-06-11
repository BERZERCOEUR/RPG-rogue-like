/**
 * DONJON INFINI — État de jeu du jalon M1 : un étage, position de
 * l'aventurier, brouillard de guerre (salles explorées), compteur de tours.
 *
 * §3.5 : chaque déplacement d'une case à une autre compte 1 tour.
 * M1 ne gère qu'un seul étage ; les accès/villes arrivent en M2.
 */
class GameState {
  constructor(seed, cfg) {
    this.cfg = cfg;
    this.seed = String(seed);
    this.rng = new RNG(this.seed);
    this.floor = generateFloor(this.rng, cfg);
    this.tour = 0;
    this.explored = new Set();

    // M1 : apparition sur une salle jouable aléatoire (en M2 : case d'accès).
    const playable = [];
    for (let i = 0; i < cfg.GRID_SIZE * cfg.GRID_SIZE; i++) {
      if (!this.floor.unplayable[i]) playable.push(i);
    }
    this.pos = this.rng.pick(playable);
    this.explored.add(this.pos);
  }

  /** Salles reliées à la position courante par un passage du labyrinthe. */
  accessible() {
    return this.floor.passages[this.pos];
  }

  canMoveTo(idx) {
    return this.floor.passages[this.pos].includes(idx);
  }

  /** Déplacement vers une salle reliée. Retourne true si le pas a eu lieu. */
  moveTo(idx) {
    if (!this.canMoveTo(idx)) return false;
    this.pos = idx;
    this.explored.add(idx);
    this.tour++;
    return true;
  }

  /** Déplacement clavier : dx/dy dans {-1, 0, 1}. */
  moveDir(dx, dy) {
    const size = this.cfg.GRID_SIZE;
    const x = (this.pos % size) + dx;
    const y = Math.floor(this.pos / size) + dy;
    if (x < 0 || x >= size || y < 0 || y >= size) return false;
    return this.moveTo(y * size + x);
  }
}

if (typeof module !== 'undefined') module.exports = { GameState };
