/**
 * DONJON INFINI — Salle de donjon vue à la PREMIÈRE PERSONNE (SVG généré).
 * Décor destiné à servir d'arrière-plan (combats, exploration).
 *
 * Aspect « naturel » demandé par Marc : pierres de tailles différentes
 * (hauteurs d'assises variables, blocs fusionnés), joints ondulés (chaque
 * assise « travaille »), coins déplacés, arêtes courbes, et un relief par
 * pierre — certaines bombées (bosse claire au centre, ombre sous l'arête
 * basse), d'autres creuses (creux sombre au centre, filet de lumière sur
 * l'arête basse). Pièce large, mur du fond plein (pas d'ouverture).
 *
 * Tout est généré par un RNG seedé : même seed → même salle. Léger, aucun
 * asset externe. Les constantes de composition sont regroupées en tête.
 */
function svgDungeonRoom(seed) {
  const rng = new RNG(`fp/${seed}`);

  // ——— Géométrie de la pièce (perspective à 1 point de fuite) ———
  const W = 800;
  const H = 600;
  const FX0 = 200; // mur du fond : rectangle [FX0..FX1] × [FY0..FY1]
  const FX1 = 600; // (large : la pièce doit respirer, pas un couloir)
  const FY0 = 138;
  const FY1 = 450;
  const PERSP = 0.38; // < 1 : compresse les blocs vers le fond

  const lerp = (a, b, t) => a + (b - a) * t;
  const persp = (t) => t / (t + PERSP * (1 - t));

  // Parois : u = profondeur (0 proche → 1 fond), v = hauteur (0 haut → 1 bas)
  const wallX = (side, u) => (side < 0 ? lerp(0, FX0, u) : lerp(W, FX1, u));
  const wallY = (u, v) => lerp(lerp(0, FY0, u), lerp(H, FY1, u), v);
  const floorY = (u) => lerp(H, FY1, u);
  const floorX = (u, c) => lerp(lerp(0, FX0, u), lerp(W, FX1, u), c);
  const ceilY = (u) => lerp(0, FY0, u);

  const P = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
  const quad = (pts, fill, extra = '') =>
    `<polygon points="${pts.map((q) => P(q[0], q[1])).join(' ')}" fill="${fill}" ${extra}/>`;
  const inset = (pts, d) => {
    const cx = pts.reduce((s, q) => s + q[0], 0) / pts.length;
    const cy = pts.reduce((s, q) => s + q[1], 0) / pts.length;
    return pts.map(([x, y]) => {
      const dx = cx - x;
      const dy = cy - y;
      const l = Math.hypot(dx, dy) || 1;
      const dd = Math.min(d, l * 0.3);
      return [x + (dx / l) * dd, y + (dy / l) * dd];
    });
  };

  /** Contour de pierre : quadrilatère aux arêtes bombées/creusées (courbes). */
  const stonePath = (cs, bow) => {
    let d = `M${P(cs[0][0], cs[0][1])}`;
    for (let i = 0; i < 4; i++) {
      const A = cs[i];
      const B = cs[(i + 1) % 4];
      const mx = (A[0] + B[0]) / 2;
      const my = (A[1] + B[1]) / 2;
      let nx = -(B[1] - A[1]);
      let ny = B[0] - A[0];
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      const k = (rng.next() * 2 - 1) * bow;
      d += `Q${P(mx + nx * k, my + ny * k)} ${P(B[0], B[1])}`;
    }
    return d + 'Z';
  };

  // ——— Palettes ———
  const wallTones = ['#847f70', '#8d887a', '#7a7566', '#928d7e', '#807b6c'];
  const wallMossT = ['#7d8266', '#747c5e'];
  const ceilTones = ['#5a564c', '#615d52', '#534f46'];
  const floorTones = ['#736f5c', '#7b7764', '#6a6654', '#807c69'];
  const JOINT = '#332f27';
  const MORTAR = '#26231c';

  const p = [];

  // ═══ Animations (flammes qui dansent, halos vacillants, poussières) ═══
  p.push(
    `<style>` +
      `.fp-flame{transform-box:view-box;animation:fpFlame 1.15s ease-in-out infinite}` +
      `@keyframes fpFlame{0%{transform:rotate(0deg) scale(1,1)}18%{transform:rotate(-3.6deg) scale(0.985,1.055)}` +
      `38%{transform:rotate(2.4deg) scale(1.012,0.94)}57%{transform:rotate(-1.8deg) scale(0.99,1.065)}` +
      `76%{transform:rotate(3deg) scale(1.005,0.965)}100%{transform:rotate(0deg) scale(1,1)}}` +
      `.fp-gflick{animation:fpFlick 2.6s ease-in-out infinite}` +
      `@keyframes fpFlick{0%{opacity:1}13%{opacity:.8}27%{opacity:.94}46%{opacity:.76}` +
      `62%{opacity:.9}80%{opacity:.83}100%{opacity:1}}` +
      `.fp-shaft{animation:fpShaft 9s ease-in-out infinite}` +
      `@keyframes fpShaft{0%{opacity:.42}50%{opacity:.6}100%{opacity:.42}}` +
      `.fp-dust circle{mix-blend-mode:screen}` +
      `@keyframes fpDriftA{from{transform:translate(0,0)}to{transform:translate(17px,-26px)}}` +
      `@keyframes fpDriftB{from{transform:translate(0,0)}to{transform:translate(-21px,-15px)}}` +
      `@keyframes fpDriftC{from{transform:translate(0,0)}to{transform:translate(10px,-34px)}}` +
      `@keyframes fpFade{0%{opacity:0}22%{opacity:.85}52%{opacity:.3}78%{opacity:.7}100%{opacity:0}}` +
      `</style>`
  );

  // ═══ Définitions (lumières, relief, textures) ═══
  p.push(
    `<defs>` +
      `<radialGradient id="glow"><stop offset="0" stop-color="rgba(255,205,110,0.85)"/>` +
      `<stop offset="0.35" stop-color="rgba(255,175,72,0.38)"/>` +
      `<stop offset="1" stop-color="rgba(255,150,50,0)"/></radialGradient>` +
      `<radialGradient id="bump"><stop offset="0" stop-color="rgba(255,246,222,0.20)"/>` +
      `<stop offset="0.6" stop-color="rgba(255,246,222,0.06)"/>` +
      `<stop offset="1" stop-color="rgba(255,246,222,0)"/></radialGradient>` +
      `<radialGradient id="dent"><stop offset="0" stop-color="rgba(8,6,3,0.26)"/>` +
      `<stop offset="0.65" stop-color="rgba(8,6,3,0.09)"/>` +
      `<stop offset="1" stop-color="rgba(8,6,3,0)"/></radialGradient>` +
      `<radialGradient id="vign" cx="0.5" cy="0.52" r="0.74">` +
      `<stop offset="0" stop-color="rgba(0,0,0,0)"/><stop offset="0.6" stop-color="rgba(0,0,0,0.06)"/>` +
      `<stop offset="1" stop-color="rgba(0,0,0,0.74)"/></radialGradient>` +
      `<linearGradient id="shaft" x1="0" y1="0" x2="0.2" y2="1">` +
      `<stop offset="0" stop-color="rgba(185,205,250,0.4)"/><stop offset="1" stop-color="rgba(185,205,250,0)"/></linearGradient>` +
      `<linearGradient id="ceilsh" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="rgba(0,0,0,0.6)"/><stop offset="1" stop-color="rgba(0,0,0,0.12)"/></linearGradient>` +
      `<linearGradient id="lsh" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0" stop-color="rgba(0,0,0,0.5)"/><stop offset="0.5" stop-color="rgba(0,0,0,0.08)"/>` +
      `<stop offset="1" stop-color="rgba(0,0,0,0.18)"/></linearGradient>` +
      `<linearGradient id="rsh" x1="1" y1="0" x2="0" y2="0">` +
      `<stop offset="0" stop-color="rgba(0,0,0,0.5)"/><stop offset="0.5" stop-color="rgba(0,0,0,0.08)"/>` +
      `<stop offset="1" stop-color="rgba(0,0,0,0.18)"/></linearGradient>` +
      `<filter id="blotch" x="0" y="0" width="100%" height="100%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" stitchTiles="stitch"/>` +
      `<feColorMatrix type="saturate" values="0"/></filter>` +
      `<filter id="grain" x="0" y="0" width="100%" height="100%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="3" stitchTiles="stitch"/>` +
      `<feColorMatrix type="saturate" values="0"/></filter>` +
      `</defs>`
  );

  p.push(`<rect width="${W}" height="${H}" fill="#141310"/>`);

  /**
   * Maçonnerie naturelle générique.
   * o.mapPt(a, b) → point écran ; b = travers des assises (0..1), a = le
   * long des assises (0..1). o.fade(a, b) ∈ [0..1] atténue jitter/relief
   * avec la profondeur. Assises de hauteurs variables, blocs fusionnés,
   * joints qui ondulent (sinusoïde par assise), coins déplacés, arêtes
   * courbes, pierre bombée / creuse / plate.
   */
  function masonry(o) {
    const R = o.rows;
    const hs = Array.from({ length: R }, () => 0.65 + rng.next() * 0.75);
    const tot = hs.reduce((s, x) => s + x, 0);
    const vb = [0];
    for (const h of hs) vb.push(vb[vb.length - 1] + h / tot);
    const sag = vb.map((_, j) => ({
      amp: j === 0 || j === R ? 0 : 1.2 + rng.next() * 3.4,
      freq: (2 + rng.next() * 3.5) * Math.PI * 2,
      phase: rng.next() * Math.PI * 2,
    }));

    // fond de mortier de la surface
    p.push(quad([o.mapPt(0, 0), o.mapPt(1, 0), o.mapPt(1, 1), o.mapPt(0, 1)], MORTAR));

    for (let j = 0; j < R; j++) {
      const off = (j % 2) * 0.5;
      const edges = [0];
      for (let k = 1; k <= o.cols; k++) {
        const t = (k - off) / o.cols;
        if (t > 0.04 && t < 0.96) edges.push(t + (rng.next() - 0.5) * (0.45 / o.cols));
      }
      edges.push(1);
      for (let k = 1; k < edges.length - 1; k++) {
        if (rng.next() < 0.13) edges.splice(k, 1); // fusion → grosses pierres
      }

      for (let k = 0; k < edges.length - 1; k++) {
        const a0 = edges[k];
        const a1 = edges[k + 1];
        const fade = o.fade((a0 + a1) / 2, (vb[j] + vb[j + 1]) / 2);
        const corner = (a, jj) => {
          const [x, y] = o.mapPt(a, vb[jj]);
          const jit = o.jitter * fade;
          return [
            x + (rng.next() - 0.5) * jit,
            y +
              sag[jj].amp * Math.sin(sag[jj].freq * a + sag[jj].phase) * fade +
              (rng.next() - 0.5) * jit,
          ];
        };
        const cs = [corner(a0, j), corner(a1, j), corner(a1, j + 1), corner(a0, j + 1)];
        const ins = inset(cs, o.mortar * fade + 0.5);
        const mossy = o.mossProb && rng.next() < o.mossProb(vb[j]);
        const tone = mossy ? rng.pick(wallMossT) : rng.pick(o.tones);
        p.push(
          `<path d="${stonePath(ins, o.bow * fade)}" fill="${tone}" stroke="${JOINT}" stroke-width="${(o.strokeW * (0.5 + 0.5 * fade)).toFixed(1)}"/>`
        );

        // ——— relief : bombée / creuse / plate ———
        const cx = ins.reduce((s, q) => s + q[0], 0) / 4;
        const cy = ins.reduce((s, q) => s + q[1], 0) / 4;
        const bw = (Math.abs(ins[1][0] - ins[0][0]) + Math.abs(ins[2][0] - ins[3][0])) / 2 || 6;
        const bh = (Math.abs(ins[3][1] - ins[0][1]) + Math.abs(ins[2][1] - ins[1][1])) / 2 || 6;
        const rot = `rotate(${rng.int(-14, 14)} ${cx.toFixed(1)} ${cy.toFixed(1)})`;
        const roll = rng.next();
        if (o.relief !== false) {
          if (roll < 0.4) {
            // bombée : bosse claire décentrée vers le haut + ombre sous l'arête basse
            p.push(
              `<ellipse cx="${cx.toFixed(1)}" cy="${(cy - bh * 0.08).toFixed(1)}" rx="${(bw * 0.46).toFixed(1)}" ry="${(bh * 0.46).toFixed(1)}" fill="url(#bump)" transform="${rot}"/>`
            );
            p.push(
              `<line x1="${ins[3][0].toFixed(1)}" y1="${(ins[3][1] - 1).toFixed(1)}" x2="${ins[2][0].toFixed(1)}" y2="${(ins[2][1] - 1).toFixed(1)}" stroke="rgba(0,0,0,0.28)" stroke-width="${(2.2 * fade).toFixed(1)}"/>`
            );
          } else if (roll < 0.66) {
            // creuse : creux sombre + filet de lumière sur l'arête basse
            p.push(
              `<ellipse cx="${cx.toFixed(1)}" cy="${(cy + bh * 0.06).toFixed(1)}" rx="${(bw * 0.44).toFixed(1)}" ry="${(bh * 0.42).toFixed(1)}" fill="url(#dent)" transform="${rot}"/>`
            );
            p.push(
              `<line x1="${ins[3][0].toFixed(1)}" y1="${(ins[3][1] - 1).toFixed(1)}" x2="${ins[2][0].toFixed(1)}" y2="${(ins[2][1] - 1).toFixed(1)}" stroke="rgba(255,244,218,0.11)" stroke-width="${(1.7 * fade).toFixed(1)}"/>`
            );
          } else {
            // plate : simple arête haute qui accroche la lumière
            p.push(
              `<line x1="${ins[0][0].toFixed(1)}" y1="${(ins[0][1] + 1.5).toFixed(1)}" x2="${ins[1][0].toFixed(1)}" y2="${(ins[1][1] + 1.5).toFixed(1)}" stroke="rgba(255,244,220,0.11)" stroke-width="${(1.5 * fade).toFixed(1)}"/>`
            );
          }
        }
        // marbrure, grain, écornure
        if (rng.next() < 0.45) {
          const dark = rng.next() < 0.6;
          p.push(
            `<ellipse cx="${(cx + (rng.next() - 0.5) * bw * 0.5).toFixed(1)}" cy="${(cy + (rng.next() - 0.5) * bh * 0.5).toFixed(1)}" rx="${(bw * (0.12 + rng.next() * 0.16)).toFixed(1)}" ry="${(bh * (0.1 + rng.next() * 0.14)).toFixed(1)}" fill="${dark ? 'rgba(30,26,18,0.11)' : 'rgba(255,248,230,0.06)'}" transform="${rot}"/>`
          );
        }
        if (rng.next() < 0.5) {
          p.push(
            `<circle cx="${(cx + (rng.next() - 0.5) * bw * 0.7).toFixed(1)}" cy="${(cy + (rng.next() - 0.5) * bh * 0.7).toFixed(1)}" r="${(0.7 + rng.next()).toFixed(1)}" fill="rgba(0,0,0,0.16)"/>`
          );
        }
        if (rng.next() < 0.12) {
          p.push(
            `<path d="M${(cx - bw * 0.2).toFixed(1)} ${(cy - bh * 0.1).toFixed(1)} l${(rng.next() * 8 - 4).toFixed(1)} ${(rng.next() * 5 + 2).toFixed(1)} l${(rng.next() * 6 - 3).toFixed(1)} ${(rng.next() * 4 - 2).toFixed(1)}" stroke="#4e493c" stroke-width="1.1" fill="none" opacity="0.7"/>`
          );
        }
      }
    }
  }

  // ═══ Les cinq surfaces ═══
  // plafond (sombre, discret)
  masonry({
    rows: 4,
    cols: 6,
    tones: ceilTones,
    mapPt: (a, b) => [floorX(persp(b), a), ceilY(persp(b))],
    fade: (a, b) => 1 - 0.6 * persp(b),
    jitter: 5,
    bow: 3,
    mortar: 1.8,
    strokeW: 1.1,
    relief: false,
  });
  // murs latéraux
  const wallOpts = (side) => ({
    rows: 8,
    cols: 8,
    tones: wallTones,
    mossProb: (v) => (v > 0.6 ? 0.22 : 0.05),
    mapPt: (a, b) => [wallX(side, persp(a)), wallY(persp(a), b)],
    fade: (a) => 1 - 0.62 * persp(a),
    jitter: 5.5,
    bow: 3.6,
    mortar: 1.9,
    strokeW: 1.1,
  });
  masonry(wallOpts(-1));
  masonry(wallOpts(1));
  // mur du fond (plein — pas d'ouverture)
  masonry({
    rows: 10,
    cols: 10,
    tones: wallTones,
    mossProb: (v) => (v > 0.65 ? 0.18 : 0.05),
    mapPt: (a, b) => [lerp(FX0, FX1, a), lerp(FY0, FY1, b)],
    fade: () => 0.55,
    jitter: 6,
    bow: 4,
    mortar: 1.4,
    strokeW: 0.9,
  });
  // sol
  masonry({
    rows: 9,
    cols: 8,
    tones: floorTones,
    mapPt: (a, b) => [floorX(persp(b), a), floorY(persp(b))],
    fade: (a, b) => 1 - 0.62 * persp(b),
    jitter: 5.5,
    bow: 3.4,
    mortar: 2.1,
    strokeW: 1.2,
  });

  // ═══ Détails : suintements, mousse, éboulis ═══
  for (let i = 0; i < 7; i++) {
    const x = rng.int(FX0 + 10, FX1 - 14);
    const y = FY0 + rng.int(4, 44);
    const h = rng.int(36, 110);
    const w = rng.int(3, 7);
    p.push(`<ellipse cx="${x + w / 2}" cy="${y}" rx="${w * 1.4}" ry="3.5" fill="#12100c" opacity="0.22" style="mix-blend-mode:multiply"/>`);
    p.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="#12100c" opacity="0.11" style="mix-blend-mode:multiply"/>`
    );
  }
  for (let i = 0; i < 9; i++) {
    const side = rng.next() < 0.5 ? -1 : 1;
    const u = persp(0.1 + rng.next() * 0.85);
    const x = wallX(side, u) + (side < 0 ? rng.int(2, 18) : -rng.int(2, 18));
    const y = floorY(u) - rng.int(0, 5);
    const s = 1 - 0.55 * u;
    p.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(14 * s).toFixed(1)}" ry="${(5.5 * s).toFixed(1)}" fill="#5b7343" opacity="0.75"/>`);
    p.push(`<ellipse cx="${(x + 6 * s).toFixed(1)}" cy="${(y - 3 * s).toFixed(1)}" rx="${(8 * s).toFixed(1)}" ry="${(3.5 * s).toFixed(1)}" fill="#4c6238" opacity="0.8"/>`);
  }
  for (let i = 0; i < 9; i++) {
    const u = persp(0.06 + rng.next() * 0.8);
    let c = rng.next();
    if (c > 0.4 && c < 0.6) c = c < 0.5 ? 0.32 : 0.68;
    const x = floorX(u, c);
    const y = floorY(u) - 2;
    const s = (15 + rng.int(0, 7)) * (1 - 0.6 * u);
    p.push(`<ellipse cx="${(x + s * 0.35).toFixed(1)}" cy="${(y + 2).toFixed(1)}" rx="${s.toFixed(1)}" ry="${(s * 0.3).toFixed(1)}" fill="#000" opacity="0.32"/>`);
    const pts = [];
    const n = rng.int(5, 7);
    for (let a = 0; a < n; a++) {
      const ang = (a / n) * Math.PI * 2 + rng.next() * 0.5;
      const r = s * (0.55 + rng.next() * 0.45);
      pts.push([x + Math.cos(ang) * r, y - s * 0.38 + Math.sin(ang) * r * 0.6]);
    }
    p.push(quad(pts, rng.pick(wallTones), `stroke="${JOINT}" stroke-width="1"`));
    p.push(
      `<line x1="${pts[0][0].toFixed(1)}" y1="${pts[0][1].toFixed(1)}" x2="${pts[1][0].toFixed(1)}" y2="${pts[1][1].toFixed(1)}" stroke="rgba(255,240,200,0.16)" stroke-width="1.4"/>`
    );
  }

  // ═══ Texture : taches de pierre (basse fréquence) + grain fin ═══
  p.push(`<rect width="${W}" height="${H}" filter="url(#blotch)" opacity="0.14" style="mix-blend-mode:multiply"/>`);
  p.push(`<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.16" style="mix-blend-mode:overlay"/>`);

  // ═══ Lumières ═══
  p.push(`<rect width="${W}" height="${H}" fill="rgba(0,0,0,0.30)" style="mix-blend-mode:multiply"/>`);
  p.push(quad([[0, 0], [W, 0], [FX1, FY0], [FX0, FY0]], 'url(#ceilsh)', 'style="mix-blend-mode:multiply"'));
  p.push(quad([[0, 0], [FX0, FY0], [FX0, FY1], [0, H]], 'url(#lsh)', 'style="mix-blend-mode:multiply"'));
  p.push(quad([[W, 0], [FX1, FY0], [FX1, FY1], [W, H]], 'url(#rsh)', 'style="mix-blend-mode:multiply"'));

  // rai de lumière froide tombant d'une faille du plafond (pulsation lente)
  p.push(
    `<polygon class="fp-shaft" points="318,0 372,0 348,${FY0 + 74} 288,${FY0 + 52}" fill="url(#shaft)" style="mix-blend-mode:screen"/>`
  );

  // torches murales (gauche profonde, droite proche) : halo vacillant + flamme dansante
  const torchPos = [];
  function torch(side, u, v, flickDur, flameDur, delay) {
    const inward = side < 0 ? 1 : -1;
    const x = wallX(side, u) + inward * 8;
    const y = wallY(u, v);
    const s = 1 - 0.45 * u;
    torchPos.push([x, y, s]);
    // halos regroupés : l'opacité du groupe vacille
    p.push(`<g class="fp-gflick" style="animation-duration:${flickDur}s;animation-delay:${-delay}s">`);
    p.push(`<circle cx="${x}" cy="${y - 8 * s}" r="${(195 * s).toFixed(0)}" fill="url(#glow)" style="mix-blend-mode:screen"/>`);
    p.push(`<circle cx="${x}" cy="${y - 8 * s}" r="${(64 * s).toFixed(0)}" fill="url(#glow)" style="mix-blend-mode:screen" opacity="0.9"/>`);
    p.push(
      `<ellipse cx="${(x + inward * 40 * s).toFixed(1)}" cy="${(floorY(u) - 8).toFixed(1)}" rx="${(190 * s).toFixed(0)}" ry="${(48 * s).toFixed(0)}" fill="url(#glow)" style="mix-blend-mode:screen" opacity="0.8"/>`
    );
    p.push(`</g>`);
    p.push(
      `<path d="M${x} ${y + 30 * s} L${(x + inward * 7 * s).toFixed(1)} ${y}" stroke="#4a3a29" stroke-width="${(6 * s).toFixed(1)}" stroke-linecap="round"/>`
    );
    p.push(`<circle cx="${x}" cy="${(y + 28 * s).toFixed(1)}" r="${(4.5 * s).toFixed(1)}" fill="#332c22"/>`);
    const fx = x + inward * 7 * s;
    // flamme : le groupe danse autour de sa base
    p.push(
      `<g class="fp-flame" style="transform-origin:${fx.toFixed(1)}px ${(y + 2 * s).toFixed(1)}px;animation-duration:${flameDur}s;animation-delay:${-delay}s">`
    );
    p.push(
      `<path d="M${fx} ${y - 26 * s} C ${fx - 10 * s} ${y - 11 * s}, ${fx - 8 * s} ${y - 3 * s}, ${fx} ${y + 2 * s} C ${fx + 8 * s} ${y - 3 * s}, ${fx + 10 * s} ${y - 11 * s}, ${fx} ${y - 26 * s} Z" fill="#d4802e"/>`
    );
    p.push(
      `<path d="M${fx} ${y - 15 * s} C ${fx - 5 * s} ${y - 6 * s}, ${fx - 4 * s} ${y - 1 * s}, ${fx} ${y + 1.5 * s} C ${fx + 4 * s} ${y - 1 * s}, ${fx + 5 * s} ${y - 6 * s}, ${fx} ${y - 15 * s} Z" fill="#f4c95a"/>`
    );
    p.push(`<ellipse cx="${fx}" cy="${(y - 4 * s).toFixed(1)}" rx="${(2.4 * s).toFixed(1)}" ry="${(4 * s).toFixed(1)}" fill="#fdf0c0"/>`);
    p.push(`</g>`);
  }
  torch(-1, 0.52, 0.34, 2.6, 1.15, 0);
  torch(1, 0.28, 0.32, 3.3, 1.32, 1.4);

  // ═══ Poussières en suspension, qui dérivent dans la lumière ═══
  {
    const drifts = ['fpDriftA', 'fpDriftB', 'fpDriftC'];
    for (let i = 0; i < 18; i++) {
      let x;
      let y;
      if (i < 5) {
        // près du rai de lumière
        x = 300 + rng.int(0, 80);
        y = 100 + rng.int(0, 220);
      } else if (i < 11) {
        // près des torches
        const [tx, ty, ts] = torchPos[i % 2];
        x = tx + rng.int(-90, 90) * ts;
        y = ty + rng.int(-70, 90) * ts;
      } else {
        x = rng.int(60, W - 60);
        y = rng.int(110, H - 90);
      }
      const r = 0.7 + rng.next() * 1.2;
      const alpha = 0.16 + rng.next() * 0.24;
      const drift = drifts[rng.int(0, drifts.length - 1)];
      const dur = (7 + rng.next() * 8).toFixed(1);
      const fdur = (5 + rng.next() * 6).toFixed(1);
      p.push(
        `<g class="fp-dust" style="animation:${drift} ${dur}s ease-in-out ${(-rng.next() * 10).toFixed(1)}s infinite alternate">` +
          `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="rgba(255,238,200,${alpha.toFixed(2)})" ` +
          `style="animation:fpFade ${fdur}s ease-in-out ${(-rng.next() * 8).toFixed(1)}s infinite"/></g>`
      );
    }
  }

  // vignettage global
  p.push(`<rect width="${W}" height="${H}" fill="url(#vign)" style="mix-blend-mode:multiply"/>`);

  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">${p.join('')}</svg>`;
}

if (typeof module !== 'undefined') module.exports = { svgDungeonRoom };
