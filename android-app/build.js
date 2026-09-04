const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const { syncAssets } = require('./scripts/sync-assets');

const srcDir = path.join(__dirname, 'www-src');
const outDir = path.join(__dirname, 'www');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of fs.readdirSync(srcDir)) {
  if (file.endsWith('.html')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(outDir, file));
  }
}

esbuild.buildSync({
  entryPoints: [
    path.join(srcDir, 'js', 'main.js'),
    path.join(srcDir, 'js', 'auth.js'),
    path.join(srcDir, 'js', 'reminderScreen.js'),
    path.join(srcDir, 'js', 'settings.js'),
    path.join(srcDir, 'js', 'overlay.js'),
  ],
  outdir: path.join(outDir, 'js'),
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2019',
});

syncAssets(outDir);

console.log('Built www-src -> www');
