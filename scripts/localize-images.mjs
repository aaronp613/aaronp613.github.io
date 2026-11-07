// Downloads the card images referenced in data/leaks.json and data/articles.json, resizes them to what the
// cards actually display (640px wide covers retina), and serves them from images/cards/ instead of hotlinking.
//
//   node scripts/localize-images.mjs
//
// Safe to re-run: entries already pointing at images/cards/ are skipped, and the original address is kept in
// "imageSource" so a changed or broken file can be fetched again. New entries can keep their remote image
// address until you run this script.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const WIDTH = 640;
const OUT_DIR = "images/cards";
mkdirSync(OUT_DIR, { recursive: true });

let downloaded = 0, skipped = 0, failed = 0, before = 0, after = 0;

for (const file of ["data/leaks.json", "data/articles.json"]) {
  const entries = JSON.parse(readFileSync(file, "utf8"));
  for (const entry of entries) {
    const source = entry.imageSource ?? entry.image;
    if (!/^https?:\/\//.test(source)) { skipped++; continue; }
    const name = `${createHash("sha1").update(source).digest("hex").slice(0, 12)}.webp`;
    const target = `${OUT_DIR}/${name}`;
    if (!existsSync(target)) {
      try {
        const response = await fetch(source, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const original = Buffer.from(await response.arrayBuffer());
        const resized = await sharp(original).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
        writeFileSync(target, resized);
        before += original.length; after += resized.length; downloaded++;
      } catch (error) {
        console.warn(`failed: ${entry.name ?? entry.title}: ${error.message} (keeping the remote image)`);
        failed++;
        continue;
      }
    } else skipped++;
    entry.imageSource = source;
    entry.image = `/${target}`;
  }
  writeFileSync(file, JSON.stringify(entries, null, 2) + "\n");
}

const kb = n => `${(n / 1024).toFixed(0)}KB`;
console.log(`images: ${downloaded} downloaded (${kb(before)} -> ${kb(after)}), ${skipped} already local, ${failed} failed`);
