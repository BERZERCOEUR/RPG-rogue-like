/**
 * DONJON INFINI — Rendu du plateau et interactions (jalons M1–M2).
 * États visuels des cases et marqueurs : §13.2 du document de référence.
 *
 * Priorité d'affichage choisie : accessible > explorée > inexplorée
 * (les salles reliées à la position courante sont toujours signalées,
 * c'est ce qui rend les murs invisibles lisibles).
 *
 * Marqueurs (§13.2) — cachés tant que la case n'est pas explorée ;
 * permanents pour les salles fixes (accès, ville) :
 *   ville/départ = cercle vert, montée = cercle orange, descente = cercle
 *   jaune, combat non vaincu = triangle rouge inversé (opacité 65%).
 * Aventurier : point rond clair ; sur case spéciale : demi-cercle case /
 * demi-cercle aventurier.
 */
const CASE_COLORS = { ville: '#5a9e6f', orange: '#c47c35', jaune: '#b8a030' };

class BoardUI {
  constructor(root, onCellClick) {
    this.root = root;
    this.onCellClick = onCellClick;
    this.cells = [];
    this.debug = false;
  }

  build(cfg) {
    this.root.innerHTML = '';
    this.cells = [];
    const n = cfg.GRID_SIZE * cfg.GRID_SIZE;
    for (let i = 0; i < n; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.idx = i;
      cell.addEventListener('click', () => this.onCellClick(i));
      this.root.appendChild(cell);
      this.cells.push(cell);
    }
  }

  cellContent(floor, i, isPawn) {
    const type = floor.type[i];
    const special = CASE_COLORS[type];
    if (isPawn) {
      if (special) {
        return (
          `<div class="pawn-split"><div class="half" style="background:${special}"></div>` +
          `<div class="half" style="background:#c8c4bc"></div></div>`
        );
      }
      return '<div class="pawn"></div>';
    }
    if (!floor.explored[i]) return '';
    if (special) return `<div class="marker" style="background:${special}"></div>`;
    if (type === 'monstre' && !floor.vaincu[i]) return '<div class="marker-combat"></div>';
    return '';
  }

  render(game) {
    const floor = game.current();
    const accessible = new Set(floor.layout.passages[game.pos]);
    this.cells.forEach((cell, i) => {
      let cls = 'cell';
      if (floor.layout.unplayable[i]) cls += ' unplayable';
      else if (accessible.has(i)) cls += ' accessible';
      else if (floor.explored[i]) cls += ' explored';
      else cls += ' unexplored';
      if (i === game.pos) cls += ' current';
      cell.className = cls;

      let html = this.cellContent(floor, i, i === game.pos);
      if (this.debug && !floor.layout.unplayable[i]) {
        const letters = {
          monstre: 'M', vide: 'V', tresor: 'T', piege: 'P',
          orange: 'O', jaune: 'J', ville: 'C',
        };
        const t = floor.type[i];
        html += `<span class="debug-type">${t === null ? '·' : letters[t]}</span>`;
      }
      cell.innerHTML = html;
    });
  }
}

if (typeof module !== 'undefined') module.exports = { BoardUI };
