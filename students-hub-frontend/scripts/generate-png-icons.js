import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk("IHDR", ihdr);

  // Raw image raster
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowStride);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) / 2;
  const safeRadius = isMaskable ? maxRadius * 0.72 : maxRadius * 0.88;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: deep dark slate #12141a
      let r = 18;
      let g = 20;
      let b = 26;
      let a = 255;

      // Gradient overlay towards bottom-right
      const gradFactor = (x + y) / (width + height);
      r = Math.floor(r + (30 - r) * gradFactor);
      g = Math.floor(g + (27 - g) * gradFactor);
      b = Math.floor(b + (42 - b) * gradFactor);

      // Outer border / rounded rect shape
      const cornerRadius = width * 0.22;
      const qx = Math.max(0, Math.abs(dx) - (cx - cornerRadius));
      const qy = Math.max(0, Math.abs(dy) - (cy - cornerRadius));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);

      if (cornerDist > cornerRadius) {
        // Transparent outside rounded corners (unless maskable, where full bleed is required)
        if (!isMaskable) {
          a = 0;
        }
      }

      if (a > 0) {
        // Inner Glow / Circle
        if (dist < safeRadius) {
          // Central emblem: purple / violet study shield
          const coreDist = dist / safeRadius;
          if (coreDist < 0.65) {
            // Book / emblem core: #a78bfa (167, 139, 250)
            const blend = 1 - coreDist / 0.65;
            r = Math.floor(r * (1 - blend) + 196 * blend);
            g = Math.floor(g * (1 - blend) + 181 * blend);
            b = Math.floor(b * (1 - blend) + 253 * blend);
          } else if (coreDist < 0.75) {
            // Accent ring: mint green #34d399 (52, 211, 153)
            r = 52;
            g = 211;
            b = 153;
          }
        }
      }

      rawData[pxOffset + 0] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatCompressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", idatCompressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const targetDir = path.resolve("students-hub-frontend/public");
fs.mkdirSync(targetDir, { recursive: true });

fs.writeFileSync(path.join(targetDir, "pwa-192x192.png"), createPng(192, 192, false));
fs.writeFileSync(path.join(targetDir, "pwa-512x512.png"), createPng(512, 512, false));
fs.writeFileSync(path.join(targetDir, "pwa-maskable-512x512.png"), createPng(512, 512, true));
fs.writeFileSync(path.join(targetDir, "apple-touch-icon.png"), createPng(180, 180, false));
fs.writeFileSync(path.join(targetDir, "favicon.png"), createPng(64, 64, false));

console.log("Successfully generated all PWA PNG icons in", targetDir);
