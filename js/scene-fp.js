/**
 * DONJON INFINI — Salle de donjon vue à la PREMIÈRE PERSONNE (SVG généré).
 * Décor destiné à servir d'arrière-plan (combats, exploration) — demandé par
 * Marc en remplacement de la scène type Pokémon : pierres taillées empilées
 * en perspective (point de fuite central), sol dallé, jeux d'ombres et de
 * lumières (torches, halo, vignettage, suintements, mousse, éboulis).
 *
 * Tout est généré par un RNG seedé : même seed → même salle. Léger, aucun
 * asset externe. Les constantes de composition sont regroupées en tête.
 */

/* eslint-disable prefer-template */
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
  const P = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;

  // Parois : u = profondeur (0 proche → 1 fond), v = hauteur (0 haut → 1 bas)
  const wallX = (side, u) => (side < 0 ? lerp(0, FX0, u) : lerp(W, FX1, u));
  const wallY = (u, v) => lerp(lerp(0, FY0, u), lerp(H, FY1, u), v);
  const floorY = (u) => lerp(H, FY1, u);
  const floorX = (u, c) => lerp(lerp(0, FX0, u), lerp(W, FX1, u), c);
  const ceilY = (u) => lerp(0, FY0, u);

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

  // ——— Palettes ———
  const wallTones = ['#847f70', '#8d887a', '#7a7566', '#928d7e', '#807b6c'];
  const wallMossT = ['#7d8266', '#747c5e'];
  const ceilTones = ['#5a564c', '#615d52', '#534f46'];
  const floorTones = ['#736f5c', '#7b7764', '#6a6654', '#807c69'];
  const JOINT = '#332f27';

  const p = [];

  // ═══ Définitions (lumières) ═══
  p.push(
    `<defs>` +
      `<radialGradient id="glow"><stop offset="0" stop-color="rgba(255,205,110,0.85)"/>` +
      `<stop offset="0.35" stop-color="rgba(255,175,72,0.38)"/>` +
      `<stop offset="1" stop-color="rgba(255,150,50,0)"/></radialGradient>` +
      `<filter id="blotch" x="0" y="0" width="100%" height="100%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" stitchTiles="stitch"/>` +
      `<feColorMatrix type="saturate" values="0"/></filter>` +
      `<filter id="grain" x="0" y="0" width="100%" height="100%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="3" stitchTiles="stitch"/>` +
      `<feColorMatrix type="saturate" values="0"/></filter>` +
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
      `</defs>`
  );

  p.push(`<rect width="${W}" height="${H}" fill="#141310"/>`);

  // ═══ Plafond : dalles sombres convergentes ═══
  p.push(quad([[0, 0], [W, 0], [FX1, FY0], [FX0, FY0]], '#4c483e'));
  {
    const NZ = 5;
    const COLS = 6;
    const st = [];
    for (let k = 0; k <= NZ; k++) st.push(persp(k / NZ));
    for (let k = 0; k < NZ; k++) {
      const off = (k % 2) * 0.5;
      const edges = [0];
      for (let i = 1; i <= COLS; i++) {
        const t = (i - off) / COLS;
        if (t > 0.03 && t < 0.97) edges.push(t);
      }
      edges.push(1);
      for (let i = 0; i < edges.length - 1; i++) {
        const pts = [
          [floorX(st[k], edges[i]), ceilY(st[k])],
          [floorX(st[k], edges[i + 1]), ceilY(st[k])],
          [floorX(st[k + 1], edges[i + 1]), ceilY(st[k + 1])],
          [floorX(st[k + 1], edges[i]), ceilY(st[k + 1])],
        ];
        p.push(quad(inset(pts, 1.6), rng.pick(ceilTones), `stroke="${JOINT}" stroke-width="1"`));
      }
    }
  }

  // ═══ Murs latéraux : assises de pierres taillées, appareillage décalé ═══
  function sideWall(side) {
    const COURSES = 9;
    const NZ = 9;
    for (let j = 0; j < COURSES; j++) {
      const v0 = j / COURSES;
      const v1 = (j + 1) / COURSES;
      const off = (j % 2) * 0.5;
      const edges = [0];
      for (let k = 1; k <= NZ; k++) {
        const t = (k - off) / NZ;
        if (t > 0.02 && t < 0.98) edges.push(persp(t));
      }
      edges.push(1);
      for (let k = 0; k < edges.length - 1; k++) {
        const u0 = edges[k];
        const u1 = edges[k + 1];
        const mossy = j >= COURSES - 2 && rng.next() < 0.2;
        const tone = mossy ? rng.pick(wallMossT) : rng.pick(wallTones);
        const pts = [
          [wallX(side, u0), wallY(u0, v0)],
          [wallX(side, u1), wallY(u1, v0)],
          [wallX(side, u1), wallY(u1, v1)],
          [wallX(side, u0), wallY(u0, v1)],
        ];
        p.push(quad(inset(pts, 1.7), tone, `stroke="${JOINT}" stroke-width="1.1"`));
        // relief : arête supérieure éclairée, arête inférieure dans l'ombre
        p.push(
          `<line x1="${pts[0][0].toFixed(1)}" y1="${(pts[0][1] + 2).toFixed(1)}" x2="${pts[1][0].toFixed(1)}" y2="${(pts[1][1] + 2).toFixed(1)}" stroke="rgba(255,244,220,0.12)" stroke-width="1.6"/>`
        );
        p.push(
          `<line x1="${pts[3][0].toFixed(1)}" y1="${(pts[3][1] - 1.8).toFixed(1)}" x2="${pts[2][0].toFixed(1)}" y2="${(pts[2][1] - 1.8).toFixed(1)}" stroke="rgba(0,0,0,0.24)" stroke-width="1.8"/>`
        );
        // marbrures et grain de la pierre
        const bw = Math.abs(pts[1][0] - pts[0][0]);
        const bhh = Math.abs(pts[3][1] - pts[0][1]);
        for (let m = 0; m < 2; m++) {
          if (rng.next() < 0.65) {
            const mx = lerp(pts[0][0], pts[1][0], 0.2 + rng.next() * 0.6);
            const my = lerp(pts[0][1], pts[3][1], 0.25 + rng.next() * 0.5);
            const dark = rng.next() < 0.6;
            p.push(
              `<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="${(bw * (0.14 + rng.next() * 0.2)).toFixed(1)}" ry="${(bhh * (0.1 + rng.next() * 0.16)).toFixed(1)}" fill="${dark ? 'rgba(30,26,18,0.10)' : 'rgba(255,248,230,0.06)'}" transform="rotate(${rng.int(-30, 30)} ${mx.toFixed(1)} ${my.toFixed(1)})"/>`
            );
          }
        }
        if (rng.next() < 0.6) {
          const gx = lerp(pts[0][0], pts[1][0], 0.15 + rng.next() * 0.7);
          const gy = lerp(pts[0][1], pts[3][1], 0.2 + rng.next() * 0.6);
          p.push(`<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="${(0.7 + rng.next()).toFixed(1)}" fill="rgba(0,0,0,0.16)"/>`);
        }
        // écornures
        if (rng.next() < 0.16) {
          const ex = lerp(pts[0][0], pts[1][0], 0.2 + rng.next() * 0.6);
          const ey = lerp(pts[0][1], pts[3][1], 0.25 + rng.next() * 0.5);
          p.push(
            `<path d="M${ex.toFixed(1)} ${ey.toFixed(1)} l${(rng.next() * 8 - 4).toFixed(1)} ${(rng.next() * 5 + 2).toFixed(1)} l${(rng.next() * 6 - 3).toFixed(1)} ${(rng.next() * 4 - 2).toFixed(1)}" stroke="#4e493c" stroke-width="1.1" fill="none" opacity="0.75"/>`
          );
        }
      }
    }
  }
  sideWall(-1);
  sideWall(1);

  // ═══ Mur du fond : petites assises + arche sombre ═══
  {
    p.push(quad([[FX0, FY0], [FX1, FY0], [FX1, FY1], [FX0, FY1]], '#6e6a5c'));
    const bh = 26;
    let rowi = 0;
    for (let y = FY0; y < FY1; y += bh, rowi++) {
      let x = FX0 - (rowi % 2 ? 18 : 0);
      while (x < FX1) {
        const w = rng.int(24, 44);
        const x0 = Math.max(FX0, x);
        const x1 = Math.min(FX1, x + w);
        const y1 = Math.min(FY1, y + bh);
        if (x1 - x0 > 5) {
          const tone = rng.next() < 0.12 ? rng.pick(wallMossT) : rng.pick(wallTones);
          p.push(quad(inset([[x0, y], [x1, y], [x1, y1], [x0, y1]], 1.3), tone, `stroke="${JOINT}" stroke-width="0.9"`));
          // relief + marbrure (mur plein, pas d'ouverture — demande Marc)
          p.push(`<line x1="${x0 + 2}" y1="${y + 2}" x2="${x1 - 2}" y2="${y + 2}" stroke="rgba(255,244,220,0.10)" stroke-width="1.2"/>`);
          if (rng.next() < 0.55) {
            const mx = lerp(x0, x1, 0.25 + rng.next() * 0.5);
            const my = lerp(y, y1, 0.3 + rng.next() * 0.4);
            const dark = rng.next() < 0.6;
            p.push(
              `<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="${((x1 - x0) * (0.16 + rng.next() * 0.18)).toFixed(1)}" ry="${(bh * (0.12 + rng.next() * 0.14)).toFixed(1)}" fill="${dark ? 'rgba(30,26,18,0.10)' : 'rgba(255,248,230,0.06)'}" transform="rotate(${rng.int(-25, 25)} ${mx.toFixed(1)} ${my.toFixed(1)})"/>`
            );
          }
        }
        x += w;
      }
    }
  }

  // ═══ Sol : dallage convergent vers le point de fuite ═══
  {
    p.push(quad([[0, H], [W, H], [FX1, FY1], [FX0, FY1]], '#37342b'));
    const NZ = 10;
    const COLS = 8;
    const st = [];
    for (let k = 0; k <= NZ; k++) st.push(persp(k / NZ));
    for (let k = 0; k < NZ; k++) {
      const off = (k % 2) * 0.5;
      const edges = [0];
      for (let i = 1; i <= COLS; i++) {
        const t = (i - off) / COLS;
        if (t > 0.02 && t < 0.98) edges.push(t);
      }
      edges.push(1);
      for (let i = 0; i < edges.length - 1; i++) {
        const pts = [
          [floorX(st[k + 1], edges[i]), floorY(st[k + 1])],
          [floorX(st[k + 1], edges[i + 1]), floorY(st[k + 1])],
          [floorX(st[k], edges[i + 1]), floorY(st[k])],
          [floorX(st[k], edges[i]), floorY(st[k])],
        ];
        const d = 2.4 - 1.6 * st[k];
        p.push(quad(inset(pts, d), rng.pick(floorTones), `stroke="${JOINT}" stroke-width="${(1.4 - 0.7 * st[k]).toFixed(1)}"`));
        // usure des dalles : marbrures translucides
        if (rng.next() < 0.5) {
          const mx = lerp(pts[3][0], pts[2][0], 0.25 + rng.next() * 0.5);
          const my = lerp(pts[3][1], pts[0][1], 0.25 + rng.next() * 0.5);
          const dw = Math.abs(pts[2][0] - pts[3][0]);
          const dark = rng.next() < 0.55;
          p.push(
            `<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="${(dw * (0.15 + rng.next() * 0.2)).toFixed(1)}" ry="${(dw * (0.05 + rng.next() * 0.07)).toFixed(1)}" fill="${dark ? 'rgba(28,24,16,0.11)' : 'rgba(255,248,230,0.06)'}"/>`
          );
        }
        // fissures de dalles
        if (rng.next() < 0.1 && st[k] < 0.75) {
          const fx = lerp(pts[3][0], pts[2][0], 0.25 + rng.next() * 0.5);
          const fy = lerp(pts[3][1], pts[0][1], 0.2 + rng.next() * 0.3);
          const s = 1 - st[k] * 0.6;
          p.push(
            `<path d="M${fx.toFixed(1)} ${fy.toFixed(1)} l${(8 * s).toFixed(1)} ${(9 * s).toFixed(1)} l${(-4 * s).toFixed(1)} ${(8 * s).toFixed(1)} l${(9 * s).toFixed(1)} ${(10 * s).toFixed(1)}" stroke="#2c2921" stroke-width="${(1.6 * s).toFixed(1)}" fill="none" opacity="0.8"/>`
          );
        }
      }
    }
  }

  // ═══ Détails : suintements, mousse, éboulis ═══
  for (let i = 0; i < 7; i++) {
    // coulures d'humidité : source sombre au joint, traînée fine qui s'estompe
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
    // mousse au pied des murs (jonction sol/mur) — plus petite avec la profondeur
    const side = rng.next() < 0.5 ? -1 : 1;
    const u = persp(0.1 + rng.next() * 0.85);
    const x = wallX(side, u) + (side < 0 ? rng.int(2, 18) : -rng.int(2, 18));
    const y = floorY(u) - rng.int(0, 5);
    const s = 1 - 0.55 * u;
    p.push(`<ellipse cx="${x}" cy="${y}" rx="${(14 * s).toFixed(1)}" ry="${(5.5 * s).toFixed(1)}" fill="#5b7343" opacity="0.75"/>`);
    p.push(`<ellipse cx="${x + 6 * s}" cy="${y - 3 * s}" rx="${(8 * s).toFixed(1)}" ry="${(3.5 * s).toFixed(1)}" fill="#4c6238" opacity="0.8"/>`);
  }
  for (let i = 0; i < 9; i++) {
    // éboulis : pierres tombées, avec ombre portée
    const u = persp(0.06 + rng.next() * 0.8);
    let c = rng.next();
    if (c > 0.4 && c < 0.6) c = c < 0.5 ? 0.32 : 0.68; // garder l'axe central lisible
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
  // pénombre générale : la pièce est sombre, les torches recreusent la lumière
  p.push(`<rect width="${W}" height="${H}" fill="rgba(0,0,0,0.30)" style="mix-blend-mode:multiply"/>`);
  // assombrissement du plafond et des angles proches
  p.push(quad([[0, 0], [W, 0], [FX1, FY0], [FX0, FY0]], 'url(#ceilsh)', 'style="mix-blend-mode:multiply"'));
  p.push(quad([[0, 0], [FX0, FY0], [FX0, FY1], [0, H]], 'url(#lsh)', 'style="mix-blend-mode:multiply"'));
  p.push(quad([[W, 0], [FX1, FY0], [FX1, FY1], [W, H]], 'url(#rsh)', 'style="mix-blend-mode:multiply"'));

  // rai de lumière froide tombant d'une faille du plafond
  p.push(
    `<polygon points="318,0 372,0 348,${FY0 + 74} 288,${FY0 + 52}" fill="url(#shaft)" style="mix-blend-mode:screen" opacity="0.55"/>`
  );
  // torches murales (gauche profonde, droite proche) : halo + flamme
  function torch(side, u, v) {
    const inward = side < 0 ? 1 : -1;
    const x = wallX(side, u) + inward * 8;
    const y = wallY(u, v);
    const s = 1 - 0.45 * u;
    // halo large sur le mur, cœur brillant, flaque de lumière au sol
    p.push(`<circle cx="${x}" cy="${y - 8 * s}" r="${(195 * s).toFixed(0)}" fill="url(#glow)" style="mix-blend-mode:screen"/>`);
    p.push(`<circle cx="${x}" cy="${y - 8 * s}" r="${(64 * s).toFixed(0)}" fill="url(#glow)" style="mix-blend-mode:screen" opacity="0.9"/>`);
    p.push(
      `<ellipse cx="${(x + inward * 40 * s).toFixed(1)}" cy="${(floorY(u) - 8).toFixed(1)}" rx="${(190 * s).toFixed(0)}" ry="${(48 * s).toFixed(0)}" fill="url(#glow)" style="mix-blend-mode:screen" opacity="0.8"/>`
    );
    // support et manche
    p.push(
      `<path d="M${x} ${y + 30 * s} L${(x + inward * 7 * s).toFixed(1)} ${y}" stroke="#4a3a29" stroke-width="${(6 * s).toFixed(1)}" stroke-linecap="round"/>`
    );
    p.push(`<circle cx="${x}" cy="${(y + 28 * s).toFixed(1)}" r="${(4.5 * s).toFixed(1)}" fill="#332c22"/>`);
    // flamme
    const fx = x + inward * 7 * s;
    p.push(
      `<path d="M${fx} ${y - 26 * s} C ${fx - 10 * s} ${y - 11 * s}, ${fx - 8 * s} ${y - 3 * s}, ${fx} ${y + 2 * s} C ${fx + 8 * s} ${y - 3 * s}, ${fx + 10 * s} ${y - 11 * s}, ${fx} ${y - 26 * s} Z" fill="#d4802e"/>`
    );
    p.push(
      `<path d="M${fx} ${y - 15 * s} C ${fx - 5 * s} ${y - 6 * s}, ${fx - 4 * s} ${y - 1 * s}, ${fx} ${y + 1.5 * s} C ${fx + 4 * s} ${y - 1 * s}, ${fx + 5 * s} ${y - 6 * s}, ${fx} ${y - 15 * s} Z" fill="#f4c95a"/>`
    );
    p.push(`<ellipse cx="${fx}" cy="${(y - 4 * s).toFixed(1)}" rx="${(2.4 * s).toFixed(1)}" ry="${(4 * s).toFixed(1)}" fill="#fdf0c0"/>`);
  }
  torch(-1, 0.52, 0.34);
  torch(1, 0.28, 0.32);

  // vignettage global
  p.push(`<rect width="${W}" height="${H}" fill="url(#vign)" style="mix-blend-mode:multiply"/>`);

  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">${p.join('')}</svg>`;
}

if (typeof module !== 'undefined') module.exports = { svgDungeonRoom };
