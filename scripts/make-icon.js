const { Jimp } = require('jimp');
const path = require('path');

function boundingBox(image, alphaThreshold) {
  const { width, height, data } = image.bitmap;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (data[o + 3] >= alphaThreshold) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function main() {
  const srcPath = path.join(__dirname, '..', 'assets', 'sprite', 'idle', '01.png');
  const img = await Jimp.read(srcPath);
  const bbox = boundingBox(img, 200);
  console.log('figure bbox:', bbox);

  // head+hair band: top ~24% of the figure's height
  const headH = Math.round(bbox.h * 0.24);
  const bandBox = boundingBox(
    img.clone().crop({ x: bbox.x, y: bbox.y, w: bbox.w, h: headH }),
    200
  );
  console.log('head band local bbox:', bandBox);

  // translate band bbox back to full-image coords
  const headX = bbox.x + bandBox.x;
  const headY = bbox.y + bandBox.y;
  const headW = bandBox.w;
  const headH2 = bandBox.h;

  const pad = Math.round(Math.max(headW, headH2) * 0.18);
  const side = Math.max(headW, headH2) + pad * 2;
  const cx = headX + headW / 2;
  const cy = headY + headH2 / 2;
  let x = Math.round(cx - side / 2);
  let y = Math.round(cy - side / 2);
  x = Math.max(0, x);
  y = Math.max(0, y);

  const square = img.clone().crop({ x, y, w: side, h: side });
  const icon = square.resize({ w: 256, h: 256 });
  const outPath = path.join(__dirname, '..', 'assets', 'icon.png');
  await icon.write(outPath);
  console.log('wrote', outPath, `(${side}x${side} -> 256x256)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
