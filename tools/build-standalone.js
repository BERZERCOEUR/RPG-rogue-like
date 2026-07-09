/**
 * DONJON INFINI — Build d'un fichier HTML autonome (dist/donjon-infini.html).
 * Inline le CSS et les scripts de index.html en un seul fichier, pratique
 * pour tester le jeu sans serveur ni checkout (envoi direct à Marc).
 *
 * Usage : node tools/build-standalone.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });

for (const [src, dest] of [
  ['index.html', 'donjon-infini.html'],
  ['decor.html', 'decor-salle.html'],
]) {
  let html = fs.readFileSync(path.join(root, src), 'utf8');
  html = html.replace(
    /<link rel="stylesheet" href="([^"]+)" \/>/g,
    (_, href) => `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}</style>`
  );
  html = html.replace(
    /<script src="([^"]+)"><\/script>/g,
    (_, s) => `<script>\n${fs.readFileSync(path.join(root, s), 'utf8')}</script>`
  );
  const out = path.join(root, 'dist', dest);
  fs.writeFileSync(out, html);
  console.log(`Écrit : ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} ko)`);
}
