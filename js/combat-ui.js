/**
 * DONJON INFINI — Interface de combat façon Pokémon (refonte demandée par
 * Marc, remplace la présentation §13.5 du GDD ; screen de référence : template
 * de scène de combat Gen 4).
 *
 * Composition : encart monstre en haut à gauche — monstres sur leur
 * plateforme en haut à droite — aventurier DE DOS au premier plan en bas à
 * gauche — encart aventurier (PV chiffrés + MP/END) en bas à droite —
 * boîte de dialogue en bas : message à gauche, menu 2×2 coloré à droite
 * (Attaque / Objets / Compétences / Fuite).
 *
 * Mécanique inchangée (moteur ATB §5) : déclenchement auto (80ms), tour
 * monstre 500ms, ciblage par clic sur un monstre (flèche ▼), bascule auto
 * à la mort de la cible, victoire → fermeture après délai.
 */
const COMBAT_DELAYS = { open: 80, monster: 500, close: 1100 };

const RACE_ACCENTS = { humain: '#c47c35', orc: '#6a8a5a', elfe: '#5a8a8a', fee: '#8a6a9a' };

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Rat géant, de profil, tourné vers l'aventurier (bas-gauche). */
function svgRat(size) {
  return `
  <svg width="${size}" height="${Math.round(size * 0.75)}" viewBox="0 0 120 90">
    <path d="M100 62 C 120 56, 120 34, 102 28" stroke="#9a8878" stroke-width="5"
          fill="none" stroke-linecap="round"/>
    <ellipse cx="68" cy="58" rx="34" ry="24" fill="#857463"/>
    <ellipse cx="82" cy="80" rx="11" ry="5" fill="#6e5e50"/>
    <ellipse cx="46" cy="80" rx="9" ry="5" fill="#6e5e50"/>
    <circle cx="30" cy="30" r="9" fill="#857463"/>
    <circle cx="30" cy="31" r="4.5" fill="#5c4c44"/>
    <circle cx="47" cy="26" r="9" fill="#857463"/>
    <circle cx="47" cy="27" r="4.5" fill="#5c4c44"/>
    <path d="M52 38 C 40 30, 24 36, 14 54 C 22 62, 40 64, 52 60 Z" fill="#93836f"/>
    <circle cx="29" cy="47" r="3.4" fill="#b03a30"/>
    <circle cx="14" cy="55" r="2.8" fill="#2e2620"/>
    <path d="M16 58 L2 54 M16 60 L4 62 M18 62 L8 70" stroke="#c8bca8"
          stroke-width="1.2" fill="none"/>
  </svg>`;
}

/** Aventurier vu de dos, au premier plan (accent de cape selon la race). */
function svgAdventurer(size, accent) {
  return `
  <svg width="${size}" height="${Math.round(size * 1.07)}" viewBox="0 0 140 150">
    <!-- épée portée dans le dos -->
    <path d="M100 52 L126 20" stroke="#77726a" stroke-width="7" stroke-linecap="round"/>
    <path d="M100 52 L126 20" stroke="#8d8880" stroke-width="3" stroke-linecap="round"/>
    <rect x="94" y="44" width="20" height="6" rx="3" fill="#8a7048" transform="rotate(-38 104 47)"/>
    <circle cx="108" cy="55" r="4.5" fill="#8a7048"/>
    <!-- cape -->
    <path d="M70 30 C 46 36, 36 62, 30 148 L110 148 C 104 62, 94 36, 70 30 Z" fill="#45443e"/>
    <path d="M30 148 C 36 62, 46 36, 70 30" stroke="${accent}" stroke-width="2.5" fill="none" opacity="0.7"/>
    <path d="M110 148 C 104 62, 94 36, 70 30" stroke="${accent}" stroke-width="2.5" fill="none" opacity="0.7"/>
    <!-- mantelet d'épaules + liseré -->
    <path d="M70 28 C 48 32, 41 46, 39 64 L101 64 C 99 46, 92 32, 70 28 Z" fill="#514f48"/>
    <path d="M39 64 L101 64" stroke="${accent}" stroke-width="3.5"/>
    <!-- bras le long de la cape -->
    <path d="M38 70 C 33 84, 32 100, 34 112 L44 110 C 42 96, 43 82, 46 72 Z" fill="#3d3c36"/>
    <path d="M102 70 C 107 84, 108 100, 106 112 L96 110 C 98 96, 97 82, 94 72 Z" fill="#3d3c36"/>
    <!-- capuche pointue -->
    <path d="M70 4 C 54 8, 47 20, 49 34 C 56 27, 84 27, 91 34 C 93 20, 86 8, 70 4 Z" fill="#5c5a52"/>
    <ellipse cx="70" cy="30" rx="21" ry="12" fill="#52514a"/>
    <path d="M49 32 C 56 26, 84 26, 91 32" stroke="${accent}" stroke-width="2" fill="none" opacity="0.6"/>
  </svg>`;
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
      <div class="atb-strip" id="atb-track"></div>
      <div class="scene">
        <div class="infobox enemy-box" id="enemy-box"></div>
        <div class="platform platform-enemy"></div>
        <div class="enemy-zone" id="enemy-zone"></div>
        <div class="platform platform-player"></div>
        <div class="player-sprite" id="player-sprite"></div>
        <div class="infobox player-box" id="player-box"></div>
      </div>
      <div class="dialog">
        <div class="msgbox" id="combat-msg"></div>
        <div class="menu">
          <button id="btn-attack" class="menu-btn attaque" disabled>Attaque</button>
          <button class="menu-btn objets locked" disabled title="Jalon M5">Objets</button>
          <button class="menu-btn competences locked" disabled title="Jalon M7">Compétences</button>
          <button class="menu-btn fuite locked" disabled title="À trancher (§14.5)">Fuite</button>
        </div>
      </div>`;
    this.atbEl = this.root.querySelector('#atb-track');
    this.enemyZone = this.root.querySelector('#enemy-zone');
    this.enemyBox = this.root.querySelector('#enemy-box');
    this.playerSprite = this.root.querySelector('#player-sprite');
    this.playerBox = this.root.querySelector('#player-box');
    this.msgEl = this.root.querySelector('#combat-msg');
    this.attackBtn = this.root.querySelector('#btn-attack');
    this.attackBtn.addEventListener('click', () => {
      if (this.attackResolver) {
        const r = this.attackResolver;
        this.attackResolver = null;
        r();
      }
    });
  }

  /** Message dans la boîte de dialogue + journal persistant (données). */
  say(type, texte) {
    this.game.log(type, texte);
    this.msgEl.textContent = texte;
  }

  bar(val, max, cls, withCount) {
    const pct = max > 0 ? Math.max(0, (val / max) * 100) : 0;
    return (
      `<div class="pbar ${cls}"><div class="fill" style="width:${pct}%"></div></div>` +
      (withCount ? `<div class="pcount">${Math.ceil(val)} / ${max}</div>` : '')
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

  /** Cible courante : bascule automatique sur le premier monstre vivant. */
  currentTarget() {
    const m = this.engine.monstres;
    if (!m[this.targetIdx] || m[this.targetIdx].pv <= 0) {
      this.targetIdx = m.findIndex((x) => x.pv > 0);
    }
    return m[this.targetIdx];
  }

  renderEnemies() {
    const monstres = this.engine.monstres;
    const size = monstres.length === 1 ? 116 : monstres.length === 2 ? 96 : 78;
    this.currentTarget();
    this.enemyZone.innerHTML = monstres
      .map((m, i) => {
        const dead = m.pv <= 0 ? ' dead' : '';
        const arrow = i === this.targetIdx && m.pv > 0 ? '<div class="target-arrow">▼</div>' : '<div class="target-arrow"></div>';
        return (
          `<div class="enemy${dead}" data-idx="${i}">${arrow}` +
          svgRat(size) +
          `<div class="mini-hp"><div class="fill" style="width:${(m.pv / m.pvMax) * 100}%"></div></div>` +
          `</div>`
        );
      })
      .join('');
    this.enemyZone.querySelectorAll('.enemy[data-idx]').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.idx);
        if (this.engine.monstres[idx].pv > 0) {
          this.targetIdx = idx;
          this.renderEnemies();
          this.renderBoxes();
        }
      });
    });
  }

  renderBoxes() {
    const t = this.currentTarget();
    if (t) {
      this.enemyBox.innerHTML =
        `<div class="head"><span class="name">${t.name}</span><span class="lv">ét. ${t.etage}</span></div>` +
        `<div class="sub">${t.famille} · ${t.rarete}</div>` +
        `<div class="hp-row"><span class="hp-label">PV</span>${this.bar(t.pv, t.pvMax, 'pv', false)}</div>`;
      this.enemyBox.style.visibility = 'visible';
    } else {
      this.enemyBox.style.visibility = 'hidden';
    }

    const a = this.engine.aventuriers[0];
    this.playerBox.innerHTML =
      `<div class="head"><span class="name">${a.name}</span><span class="lv">${a.raceLabel} · niv. ${a.niveau}</span></div>` +
      `<div class="hp-row"><span class="hp-label">PV</span>${this.bar(a.pv, a.pvMax, 'pv', false)}</div>` +
      `<div class="pcount">${Math.ceil(a.pv)} / ${a.pvMax}</div>` +
      `<div class="hp-row"><span class="hp-label">MP</span>${this.bar(a.mana, a.manaMax, 'mp', false)}</div>` +
      `<div class="hp-row"><span class="hp-label">EN</span>${this.bar(a.end, a.endMax, 'end', false)}</div>`;
  }

  renderAll() {
    this.renderATB();
    this.renderEnemies();
    this.renderBoxes();
  }

  attackText(att, def, ev) {
    if (!ev.touche) return `${att.name} attaque ${def.name} : esquivé !`;
    const crit = ev.crit ? ' critiques' : '';
    const mort = ev.mort ? ` ${def.name} est vaincu !` : '';
    return `${att.name} attaque ${def.name} : ${ev.degats} dégâts${crit}.${mort}`;
  }

  async start(monstres) {
    await delay(COMBAT_DELAYS.open);
    const game = this.game;
    this.engine = new CombatEngine([game.aventurier], monstres, game.combatRng, game.cfg);
    this.targetIdx = 0;
    const accent = RACE_ACCENTS[game.aventurier.raceKey] || '#c47c35';
    this.playerSprite.innerHTML = svgAdventurer(132, accent);
    this.root.style.display = 'flex';
    game.log('systeme', `Combat engagé — étage ${game.etage} : ${monstres.length} monstre${monstres.length > 1 ? 's' : ''}.`);
    this.say(
      'systeme',
      monstres.length === 1 ? `Un ${monstres[0].name} sauvage apparaît !` : `Des Rats géants sauvages apparaissent !`
    );
    this.renderAll();

    while (!this.engine.result()) {
      const actor = this.engine.nextActor();
      this.renderATB();
      if (actor.side === 'monstres') {
        await delay(COMBAT_DELAYS.monster);
        const targets = this.engine.living(this.engine.aventuriers);
        const target = targets.length === 1 ? targets[0] : this.engine.rng.pick(targets);
        const ev = this.engine.basicAttack(actor, target);
        this.say('monstre', this.attackText(actor, target, ev));
      } else {
        this.say('systeme', `Que va faire ${actor.name} ?`);
        this.attackBtn.disabled = false;
        await new Promise((r) => {
          this.attackResolver = r;
        });
        this.attackBtn.disabled = true;
        const target = this.currentTarget();
        const ev = this.engine.basicAttack(actor, target);
        this.say('joueur', this.attackText(actor, target, ev));
      }
      this.engine.endTurn(actor);
      game.advanceTours(1); // chaque activation = 1 tour (§3.5)
      this.renderAll();
      await delay(COMBAT_DELAYS.monster);
    }

    const res = this.engine.result();
    if (res === 'victoire') {
      game.winCombat();
      this.say('systeme', 'Victoire ! La salle est sécurisée.');
    } else {
      game.loseCombat();
      this.say('systeme', "L'aventurier est mort. Fin de la run.");
    }
    await delay(COMBAT_DELAYS.close);
    this.root.style.display = 'none';
    this.onEnd(res);
  }
}

if (typeof module !== 'undefined') module.exports = { CombatUI };
