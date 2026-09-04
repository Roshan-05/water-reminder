const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

const SHEET_PATH = path.join(__dirname, '..', 'assets', 'sprite.png');
const SPRITE_DIR = path.join(__dirname, '..', 'assets', 'sprite');
const WALK_LEFT_DIR = path.join(SPRITE_DIR, 'walk-left');
const WALK_RIGHT_DIR = path.join(SPRITE_DIR, 'walk-right');
const FRONT_DIR = path.join(SPRITE_DIR, 'front');

const ALPHA_THRESHOLD = 150;
const PAD = 15;

// Row A: walk-in cycle, side profile facing left.
const WALK_ROW_Y0 = 42;
const WALK_ROW_Y1 = 297;
const WALK_TORSO_Y1 = WALK_ROW_Y0 + Math.round((WALK_ROW_Y1 - WALK_ROW_Y0) * 0.42);
const WALK_BANDS = [
  [10, 115], [131, 255], [278, 408], [436, 569], [598, 743], [763, 909],
  [929, 1075], [1091, 1229], [1246, 1376], [1396, 1513], [1534, 1660],
];
const WALK_CANVAS_W = 200;
const WALK_CANVAS_H = 300;
const WALK_ANCHOR_X = 100;
const WALK_GROUND_Y = 290;

// Row B: turn + drink sequence, front-facing.
const FRONT_ROW_Y0 = 330;
const FRONT_ROW_Y1 = 602;
const FRONT_CANVAS_W = 180;
const FRONT_CANVAS_H = 320;
const FRONT_ANCHOR_X = 90;
const FRONT_GROUND_Y = 310;
const FRONT_FRAMES = [
  { dest: 'hold.png', x0: 534, x1: 635, padLeft: PAD, padRight: PAD },
  // Right pad trimmed: default PAD would reach into drink-1's rising edge (density climbs from x=896).
  { dest: 'drink-0.png', x0: 776, x1: 895, padLeft: PAD, padRight: 0 },
  // Left pad trimmed: default PAD would reach back into drink-0's tail (real content through x=880).
  // Right pad trimmed to the confirmed near-zero gap (1017-1021) so the next pose isn't pulled in.
  { dest: 'drink-1.png', x0: 900, x1: 1019, padLeft: 0, padRight: 0 },
  // Left pad trimmed: default PAD would reach back into an earlier pose (real content through x=1224).
  { dest: 'idle.png', x0: 1250, x1: 1350, padLeft: 0, padRight: PAD },
];

function bbox(image, x0, x1, y0, y1) {
  const { width, data } = image.bitmap;
  let minX = null, maxX = null, minY = null, maxY = null;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > ALPHA_THRESHOLD) {
        if (minX === null || x < minX) minX = x;
        if (maxX === null || x > maxX) maxX = x;
        if (minY === null || y < minY) minY = y;
        if (maxY === null || y > maxY) maxY = y;
      }
    }
  }
  if (minX === null) throw new Error(`No opaque pixels found in region [${x0},${x1}]x[${y0},${y1}]`);
  return { minX, maxX, minY, maxY };
}

async function extractWalkFrame(sheet, bandX0, bandX1) {
  const cropX0 = Math.max(0, bandX0 - PAD);
  const cropX1 = Math.min(sheet.bitmap.width - 1, bandX1 + PAD);
  const crop = sheet.clone().crop({ x: cropX0, y: WALK_ROW_Y0, w: cropX1 - cropX0 + 1, h: WALK_ROW_Y1 - WALK_ROW_Y0 + 1 });

  const torso = bbox(crop, 0, crop.bitmap.width - 1, 0, WALK_TORSO_Y1 - WALK_ROW_Y0);
  const full = bbox(crop, 0, crop.bitmap.width - 1, 0, crop.bitmap.height - 1);
  const torsoCenterX = (torso.minX + torso.maxX) / 2;

  const destX = Math.round(WALK_ANCHOR_X - torsoCenterX);
  const destY = Math.round(WALK_GROUND_Y - full.maxY);

  const canvas = new Jimp({ width: WALK_CANVAS_W, height: WALK_CANVAS_H });
  canvas.composite(crop, destX, destY);

  return { canvas, torsoCenterX, footY: full.maxY, destX, destY };
}

async function extractFrontFrame(sheet, x0, x1, padLeft, padRight) {
  const cropX0 = Math.max(0, x0 - padLeft);
  const cropX1 = Math.min(sheet.bitmap.width - 1, x1 + padRight);
  const crop = sheet.clone().crop({ x: cropX0, y: FRONT_ROW_Y0, w: cropX1 - cropX0 + 1, h: FRONT_ROW_Y1 - FRONT_ROW_Y0 + 1 });

  const full = bbox(crop, 0, crop.bitmap.width - 1, 0, crop.bitmap.height - 1);
  const centerX = (full.minX + full.maxX) / 2;

  const destX = Math.round(FRONT_ANCHOR_X - centerX);
  const destY = Math.round(FRONT_GROUND_Y - full.maxY);

  const canvas = new Jimp({ width: FRONT_CANVAS_W, height: FRONT_CANVAS_H });
  canvas.composite(crop, destX, destY);

  return { canvas, centerX, footY: full.maxY, destX, destY };
}

async function main() {
  for (const dir of [WALK_LEFT_DIR, WALK_RIGHT_DIR, FRONT_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sheet = await Jimp.read(SHEET_PATH);

  console.log('--- walk-left (torso-anchored) ---');
  const walkFrames = [];
  for (let i = 0; i < WALK_BANDS.length; i++) {
    const [x0, x1] = WALK_BANDS[i];
    const result = await extractWalkFrame(sheet, x0, x1);
    const name = String(i + 1).padStart(2, '0') + '.png';
    await result.canvas.write(path.join(WALK_LEFT_DIR, name));
    console.log(
      `${name}: torsoCenterX=${result.torsoCenterX.toFixed(1)} footY=${result.footY} -> destX=${result.destX} destY=${result.destY}`
    );
    walkFrames.push(name);
  }

  console.log('--- walk-right (mirrored) ---');
  for (const name of walkFrames) {
    const img = await Jimp.read(path.join(WALK_LEFT_DIR, name));
    img.flip({ horizontal: true, vertical: false });
    await img.write(path.join(WALK_RIGHT_DIR, name));
    console.log(`mirrored ${name}`);
  }

  console.log('--- front (hold/drink/idle) ---');
  for (const frame of FRONT_FRAMES) {
    const result = await extractFrontFrame(sheet, frame.x0, frame.x1, frame.padLeft, frame.padRight);
    await result.canvas.write(path.join(FRONT_DIR, frame.dest));
    console.log(
      `${frame.dest}: centerX=${result.centerX.toFixed(1)} footY=${result.footY} -> destX=${result.destX} destY=${result.destY}`
    );
  }

  const config = {
    imageDir: '../../../assets/sprite/',
    displayHeightPx: 150,
    walk: { distancePx: 220, durationMs: 1400, haltOffsetFromRightPx: 60 },
    walkIn: { frames: walkFrames.map((n) => `walk-left/${n}`), frameDurationMs: 100 },
    walkOut: { frames: walkFrames.map((n) => `walk-right/${n}`), frameDurationMs: 100 },
    hold: { frame: 'front/hold.png' },
    drink: { frames: ['front/drink-0.png', 'front/drink-1.png'] },
    idle: { frame: 'front/idle.png' },
    timing: {
      holdMs: 400,
      drinkFrame1Ms: 500,
      drinkFrame2Ms: 700,
      drinkFrame3Ms: 400,
      idleMs: 600,
      hideBubbleDelayMs: 250,
      confettiMs: 1100,
    },
  };
  fs.writeFileSync(path.join(SPRITE_DIR, 'sprite.config.json'), JSON.stringify(config, null, 2));
  console.log('wrote sprite.config.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
