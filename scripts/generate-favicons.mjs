import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'logo.png');
const publicDir = path.join(root, 'public');
const appDir = path.join(root, 'src', 'app');

const BG = '#FFFFFF';

async function getOpaqueBounds(imagePath) {
  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({
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
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Ignore near-black transparent plate; keep visible mark pixels
      if (a > 30 && (r > 18 || g > 18 || b > 18)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  return { minX, minY, maxX, maxY };
}

/** Prefer the laptop mark (upper part), not the wordmark below. */
async function getMarkCrop(bounds) {
  const fullW = bounds.maxX - bounds.minX + 1;
  const fullH = bounds.maxY - bounds.minY + 1;
  // Logo layout: graphic on top ~55%, text below. Keep graphic only.
  const cropH = Math.min(Math.round(fullH * 0.58), fullH);

  // Extract, then tighten again on the crop so leftover empty plate is removed
  const extracted = await sharp(src)
    .extract({
      left: bounds.minX,
      top: bounds.minY,
      width: fullW,
      height: cropH,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = extracted;
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4;
      const a = data[i + 3];
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // Keep strokes + filled apple (darker pixels with alpha)
      if (a > 40 && lum > 12 && lum < 230) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Small safety pad inside source crop (not final icon padding)
  const pad = 2;
  return {
    left: bounds.minX + Math.max(0, minX - pad),
    top: bounds.minY + Math.max(0, minY - pad),
    width: Math.min(fullW, maxX - minX + 1 + pad * 2),
    height: Math.min(cropH, maxY - minY + 1 + pad * 2),
  };
}

function roundedMask(size, radius) {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
  );
}

/**
 * Balanced favicon: full laptop mark visible (contain), white plate for
 * Chrome dark tabs, modest padding so it isn't cropped or oversized.
 */
async function makeMarkIcon(size, outPath, crop) {
  const edge = Math.max(2, Math.round(size * 0.18)); // balanced padding, no crop
  const inner = size - edge * 2;

  const mark = await sharp(src)
    .extract(crop)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .modulate({ brightness: 0.92 })
    .linear(1.2, -(128 * 0.2))
    .png()
    .toBuffer();

  const radius = Math.max(2, Math.round(size * 0.2));
  const mask = roundedMask(size, radius);

  const plate = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toBuffer();

  await sharp(plate)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(outPath);

  console.log('wrote', path.relative(root, outPath));
}

async function makeFullIcon(size, outPath, bounds) {
  const edge = Math.max(2, Math.round(size * 0.05));
  const inner = size - edge * 2;

  const logo = await sharp(src)
    .extract({
      left: bounds.minX,
      top: bounds.minY,
      width: bounds.maxX - bounds.minX + 1,
      height: bounds.maxY - bounds.minY + 1,
    })
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const radius = Math.round(size * 0.16);
  const mask = roundedMask(size, radius);
  const plate = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();

  await sharp(plate)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(outPath);

  console.log('wrote', path.relative(root, outPath));
}

const bounds = await getOpaqueBounds(src);
const crop = await getMarkCrop(bounds);
console.log('bounds', bounds);
console.log('mark crop', crop);

await makeMarkIcon(16, path.join(publicDir, 'favicon-16.png'), crop);
await makeMarkIcon(32, path.join(publicDir, 'favicon-32.png'), crop);
await makeMarkIcon(48, path.join(publicDir, 'favicon-48.png'), crop);
await makeMarkIcon(64, path.join(publicDir, 'favicon-64.png'), crop);
await makeMarkIcon(128, path.join(publicDir, 'favicon-128.png'), crop);
await makeMarkIcon(32, path.join(publicDir, 'favicon.png'), crop);
await makeFullIcon(180, path.join(publicDir, 'apple-touch-icon.png'), bounds);
await makeFullIcon(192, path.join(publicDir, 'icon-192.png'), bounds);
await makeFullIcon(512, path.join(publicDir, 'icon-512.png'), bounds);

// Next.js metadata file icons — use a larger source so Chrome HiDPI stays sharp
await makeMarkIcon(64, path.join(appDir, 'icon.png'), crop);
await makeFullIcon(180, path.join(appDir, 'apple-icon.png'), bounds);

spawnSync(process.execPath, [path.join(__dirname, 'build-favicon-ico.mjs')], {
  stdio: 'inherit',
});

console.log('done');
