// Renders public/icons/icon.svg to the PNG sizes iOS/Android need.
import { webkit } from '@playwright/test';
import fs from 'node:fs';
const svg = fs.readFileSync('public/icons/icon.svg', 'utf8');
const b = await webkit.launch(); const p = await b.newPage();
for (const [name, size, pad] of [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['apple-touch-icon.png', 180, 0], ['icon-512-maskable.png', 512, 0.1]]) {
  await p.setViewportSize({ width: size, height: size });
  const inner = size * (1 - 2 * pad);
  await p.setContent(`<body style="margin:0;background:#f4eee2;display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body>`);
  await p.screenshot({ path: `public/icons/${name}` });
}
await b.close();
