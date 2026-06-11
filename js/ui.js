/**
 * DONJON INFINI — Rendu du plateau et interactions (jalon M1).
 * États visuels des cases : §13.2 du document de référence.
 *
 * Priorité d'affichage choisie : accessible > explorée > inexplorée
 * (les salles reliées à la position courante sont toujours signalées,
 * c'est ce qui rend les murs invisibles lisibles).
 */
class BoardUI {
  constructor(root, onCellClick) {
    this.root = root;
    this.onCellClick = onCellClick;
    this.cells = [];
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

  render(state) {
    const { floor, explored, pos } = state;
    const accessible = new Set(state.accessible());
    this.cells.forEach((cell, i) => {
      let cls = 'cell';
      if (floor.unplayable[i]) cls += ' unplayable';
      else if (accessible.has(i)) cls += ' accessible';
      else if (explored.has(i)) cls += ' explored';
      else cls += ' unexplored';
      if (i === pos) cls += ' current';
      cell.className = cls;
      cell.innerHTML = i === pos ? '<div class="pawn"></div>' : '';
    });
  }
}

if (typeof module !== 'undefined') module.exports = { BoardUI };
