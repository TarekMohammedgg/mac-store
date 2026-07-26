import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'logo.png');
const out = path.join(root, 'public', 'logo-display.png');

/** Transparent square with darkened brand art — inverts cleanly in dark mode. */
const SIZE = 512;
const EDGE = Math.round(SIZE * 0.04);
const INNER = SIZE - EDGE * 2;

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({
  resolveWithObject: true,
});

const w = info.width;
const h = info.height;
let minX = w;
let minY = h;
let maxX = 0;
let maxY = 0;

for (let y = 0; y < h; y += 1) {
  for (let x = 0; x < w; x += 1) {
    const i = (y * w + x) * 4;
    const a = data[i + 3];
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (a > 30 && lum > 14) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

const cropped = await sharp(src)
  .extract({
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Flatten near-black plate to transparent; keep strokes/text as near-black opaque
const outRaw = Buffer.from(cropped.data);
for (let i = 0; i < outRaw.length; i += 4) {
  const a = outRaw[i + 3];
  const lum = (outRaw[i] + outRaw[i + 1] + outRaw[i + 2]) / 3;
  if (a < 20 || lum < 18) {
    outRaw[i] = 0;
    outRaw[i + 1] = 0;
    outRaw[i + 2] = 0;
    outRaw[i + 3] = 0;
  } else {
    // Solid black ink — CSS mask paints with bg-foreground
    outRaw[i] = 0;
    outRaw[i + 1] = 0;
    outRaw[i + 2] = 0;
    outRaw[i + 3] = 255;
  }
}

const mark = await sharp(outRaw, {
  raw: {
    width: cropped.info.width,
    height: cropped.info.height,
    channels: 4,
  },
})
  .resize(INNER, INNER, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: SIZE,
    height: SIZE,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: mark, gravity: 'centre' }])
  .png()
  .toFile(out);

console.log('wrote', path.relative(root, out));
