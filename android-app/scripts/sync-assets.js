const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function syncAssets(outDir) {
  const srcDir = path.join(__dirname, '..', '..', 'assets', 'sprite');
  const destDir = path.join(outDir, 'assets', 'sprite');
  copyDir(srcDir, destDir);
}

module.exports = { syncAssets };
