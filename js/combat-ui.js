/**
 * DONJON INFINI — Interface de combat (§13.5/§13.6, conformité prototype).
 * Structure verticale : barre ATB / bulles monstres 2×2 (61px) / bulles
 * aventuriers 2×2 (106px) / boutons d'action 2×2 / journal scrollable.
 * Grilles fixes quel que soit le nombre de participants.
 *
 * Déroulé : déclenchement auto en entrant sur une salle Combat non vaincue
 * (80ms), ciblage par clic (bordure orange, bascule auto à la mort de la
 * cible), tour des monstres 500ms après celui de l'aventurier et 500ms
 * entre monstres, victoire → 700ms avant fermeture.
 */
const COMBAT_DELAYS = { open: 80, monster: 500, close: 700 };

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CombatUI {
  constructor(root, game, onEnd) {
    this.root = root;
    this.game = game;
    this.onEnd = onEnd;
    this.engine = null;
    this.targetIdx = 0;
    this.attackResolver = null;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="atb-track" id="atb-track"></div>
      <div class="combat-grid" id="monster-grid"></div>
      <div class="combat-grid" id="adv-grid"></div>
      <div class="combat-actions">
        <button class="action-btn attack" id="btn-attack" disabled><span class="icon">⚔</span>Attaque</button>
        <button class="action-btn locked" disabled><span class="icon">✦</span>Compétences</button>
        <button class="action-btn locked" disabled><span class="icon">❖</span>Objets</button>
        <button class="action-btn locked" disabled><span class="icon">➤</span>Fuite</button>
      </div>
      <div class="journal" id="journal"></div>
    `;
    this.atbEl = this.root.querySelector('#atb-track');
    this.monsterGrid = this.root.querySelector('#monster-grid');
    this.advGrid = this.root.querySelector('#adv-grid');
    this.attackBtn = this.root.querySelector('#btn-attack');
    this.journalEl = this.root.querySelector('#journal');
    this.attackBtn.addEventListener('click', () => {
      if (this.attackResolver) {
        const r = this.attackResolver;
        this.attackResolver = null;
        r();
      }
    });
  }

  log(type, texte) {
    this.game.log(type, texte);
    this.renderJournal();
  }

  renderJournal() {
    this.journalEl.innerHTML = this.game.journal
      .map((e) => `<div class="entry ${e.type}">#${e.n} ${e.texte}</div>`)
      .join('');
    this.journalEl.scrollTop = this.journalEl.scrollHeight;
  }

  gauge(label, val, max, cls) {
    const pct = max > 0 ? (val / max) * 100 : 0;
    return (
      `<div class="gauge ${cls}"><div class="fill" style="width:${pct}%"></div>` +
      `<span class="count">${Math.ceil(val)} / ${max}</span></div>`
    );
  }

  renderATB() {
    const parts = this.engine.living(this.engine.all());
    this.atbEl.innerHTML = parts
      .map((p) => {
        const left = Math.min(99, (p.gauge / this.engine.cfg.COMBAT.ATB_MAX) * 99);
        const cls = p.side === 'monstres' ? 'monstre' : 'joueur';
        const side = left > 55 ? 'label-left' : '';
        return `<div class="atb-cursor ${cls} ${side}" style="left:${left}%"><span>${p.name}</span></div>`;
      })
      .join('');
  }

  renderMonsters() {
    const slots = [];
    for (let i = 0; i < 4; i++) {
      const m = this.engine.monstres[i];
      if (!m) {
        slots.push('<div class="bubble monster empty"><em>vide</em></div>');
        continue;
      }
      const targeted = i === this.targetIdx && m.pv > 0 ? ' targeted' : '';
      const dead = m.pv <= 0 ? ' dead' : '';
      slots.push(
        `<div class="bubble monster${targeted}${dead}" data-idx="${i}">` +
          `<div class="head"><span class="name">${m.name}</span><span class="tag">VIT ${m.stats.vitesse}</span></div>` +
          `<div class="sub">${m.famille} · ${m.rarete} · ét. ${m.etage}</div>` +
          this.gauge('PV', m.pv, m.pvMax, 'pv') +
          `</div>`
      );
    }
    this.monsterGrid.innerHTML = slots.join('');
    this.monsterGrid.querySelectorAll('.bubble[data-idx]').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.idx);
        if (this.engine.monstres[idx].pv > 0) {
          this.targetIdx = idx;
          this.renderMonsters();
        }
      });
    });
  }

  renderAdventurers() {
    const slots = [];
    for (let i = 0; i < 4; i++) {
      const a = this.engine.aventuriers[i];
      if (!a) {
        slots.push('<div class="bubble adv empty"><em>vide</em></div>');
        continue;
      }
      const dead = a.pv <= 0 ? ' dead' : '';
      slots.push(
        `<div class="bubble adv${dead}">` +
          `<div class="head"><span class="name">${a.name}</span><span class="tag">VIT ${a.stats.vitesse}</span></div>` +
          `<div class="sub">${a.raceLabel} · niv. ${a.niveau}</div>` +
          this.gauge('PV', a.pv, a.pvMax, 'pv') +
          this.gauge('MP', a.mana, a.manaMax, 'mp') +
          this.gauge('END', a.end, a.endMax, 'end') +
          `</div>`
      );
    }
    this.advGrid.innerHTML = slots.join('');
  }

  renderAll() {
    this.renderATB();
    this.renderMonsters();
    this.renderAdventurers();
  }

  /** Cible courante : bascule automatique sur le premier monstre vivant. */
  currentTarget() {
    const m = this.engine.monstres;
    if (!m[this.targetIdx] || m[this.targetIdx].pv <= 0) {
      this.targetIdx = m.findIndex((x) => x.pv > 0);
    }
    return m[this.targetIdx];
  }

  attackText(att, def, ev) {
    if (!ev.touche) return `${att.name} attaque ${def.name} : esquivé.`;
    const crit = ev.crit ? ' critiques' : '';
    const mort = ev.mort ? ` ${def.name} est vaincu.` : '';
    return `${att.name} attaque ${def.name} : ${ev.degats} dégâts${crit}.${mort}`;
  }

  async start(monstres) {
    await delay(COMBAT_DELAYS.open);
    const game = this.game;
    this.engine = new CombatEngine([game.aventurier], monstres, game.combatRng, game.cfg);
    this.targetIdx = 0;
    this.root.style.display = 'flex';
    this.log(
      'systeme',
      `Combat engagé — étage ${game.etage} : ${monstres.length} monstre${monstres.length > 1 ? 's' : ''}.`
    );
    this.renderAll();

    while (!this.engine.result()) {
      const actor = this.engine.nextActor();
      this.renderAll();
      if (actor.side === 'monstres') {
        await delay(COMBAT_DELAYS.monster);
        const targets = this.engine.living(this.engine.aventuriers);
        const target = targets.length === 1 ? targets[0] : this.engine.rng.pick(targets);
        const ev = this.engine.basicAttack(actor, target);
        this.log('monstre', this.attackText(actor, target, ev));
      } else {
        this.attackBtn.disabled = false;
        await new Promise((r) => {
          this.attackResolver = r;
        });
        this.attackBtn.disabled = true;
        const target = this.currentTarget();
        const ev = this.engine.basicAttack(actor, target);
        this.log('joueur', this.attackText(actor, target, ev));
      }
      this.engine.endTurn(actor);
      game.advanceTours(1); // chaque activation = 1 tour (§3.5)
      this.renderAll();
    }

    const res = this.engine.result();
    if (res === 'victoire') {
      game.winCombat();
      this.log('systeme', 'Victoire ! La salle est sécurisée.');
    } else {
      game.loseCombat();
      this.log('systeme', "L'aventurier est mort. Fin de la run.");
    }
    await delay(COMBAT_DELAYS.close);
    this.root.style.display = 'none';
    this.onEnd(res);
  }
}

if (typeof module !== 'undefined') module.exports = { CombatUI };
