import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Build a .ico that embeds PNG images (supported by Chrome). */
function pngsToIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = pngBuffers.map((png) => {
    const entry = { png, offset, size: png.length };
    offset += png.length;
    return entry;
  });

  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0); // reserved
  out.writeUInt16LE(1, 2); // type = icon
  out.writeUInt16LE(count, 4);

  entries.forEach((entry, i) => {
    const o = 6 + i * 16;
    // 0 means 256 in ICO width/height bytes; our PNGs are ≤48 so fine as-is
    // Read IHDR for actual dimensions
    const w = entry.png[16];
    const h = entry.png[20];
    out.writeUInt8(w >= 256 ? 0 : w, o);
    out.writeUInt8(h >= 256 ? 0 : h, o + 1);
    out.writeUInt8(0, o + 2); // color palette
    out.writeUInt8(0, o + 3); // reserved
    out.writeUInt16LE(1, o + 4); // color planes
    out.writeUInt16LE(32, o + 6); // bits per pixel
    out.writeUInt32LE(entry.size, o + 8);
    out.writeUInt32LE(entry.offset, o + 12);
  });

  entries.forEach((entry) => {
    entry.png.copy(out, entry.offset);
  });

  return out;
}

const files = ['favicon-16.png', 'favicon-32.png', 'favicon-48.png', 'favicon-64.png'].map((name) =>
  fs.readFileSync(path.join(root, 'public', name)),
);

const ico = pngsToIco(files);
const publicIco = path.join(root, 'public', 'favicon.ico');
const appIco = path.join(root, 'src', 'app', 'favicon.ico');
fs.writeFileSync(publicIco, ico);
fs.writeFileSync(appIco, ico);
console.log('wrote', publicIco, ico.length, 'bytes');
console.log('wrote', appIco);
