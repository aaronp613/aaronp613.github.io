// Site build steps. Run from the repository root.
//
//   node scripts/build.mjs render    render data/*.json into index.html (commit the result)
//   node scripts/build.mjs minify    minify mcu/script.js and mcu/style.css in place (CI only)
//   node scripts/build.mjs stamp     set the MCU service worker cache version from a content hash (CI only)
//   node scripts/build.mjs all       render, minify, stamp (what CI runs before deploying)
//
// `render` is idempotent and is the only step meant for local use. `minify` and
// `stamp` overwrite source files, so CI runs them on its own checkout only.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

const read = path => readFileSync(path, "utf8");
const json = path => JSON.parse(read(path));

const escapeHtml = value => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const formatDate = iso => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
  year: "numeric", month: "short", day: "numeric", timeZone: "UTC"
});

const byDateDesc = (a, b) => b.date.localeCompare(a.date);
const latest = entry => entry.articles[0].date; // articles are sorted newest first

const CHEVRON = '<svg class="title-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3.5,6 8,10.5 12.5,6"/></svg>';
const EXTERNAL = 'target="_blank" rel="noopener noreferrer"';

function validate(label, entries, requiredFields) {
  entries.forEach((entry, i) => {
    for (const field of requiredFields) {
      if (!entry[field]) throw new Error(`${label}[${i}] (${entry.name ?? entry.title ?? "?"}) is missing "${field}"`);
    }
  });
}

function leakCard(entry, index) {
  const id = `leak-sources-${index + 1}`;
  const links = entry.articles.map(article =>
    `<a href="${escapeHtml(article.url)}" ${EXTERNAL}><strong>${escapeHtml(article.title)}</strong><small>${formatDate(article.date)}</small></a>`
  ).join("");
  return `<article class="article-card has-sources">
  <a href="${escapeHtml(entry.articles[0].url)}" ${EXTERNAL} aria-expanded="false" aria-controls="${id}">
  <img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.alt || entry.name)}" loading="lazy" decoding="async" width="800" height="450" />
  <span>${escapeHtml(entry.name)}${CHEVRON}</span>
  </a>
  <div class="article-sources" id="${id}" aria-hidden="true" inert><div class="article-sources-inner">${links}</div></div>
</article>
`;
}

function articleCard(entry) {
  return `<article class="article-card">
  <a href="${escapeHtml(entry.url)}" ${EXTERNAL}>
  <img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.alt || entry.title)}" loading="lazy" decoding="async" width="800" height="450" />
  <span>${escapeHtml(entry.title)}</span>
  </a>
</article>
`;
}

function replaceBetween(html, name, content) {
  const start = `<!-- build:${name} -->\n`;
  const end = `<!-- /build:${name} -->`;
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from === -1 || to === -1) throw new Error(`index.html is missing the build:${name} markers`);
  return html.slice(0, from + start.length) + content + html.slice(to);
}

function render() {
  const leaks = json("data/leaks.json");
  validate("leaks", leaks, ["name", "image"]);
  leaks.forEach((leak, i) => {
    if (!Array.isArray(leak.articles) || leak.articles.length === 0) {
      throw new Error(`leaks[${i}] (${leak.name}) needs at least one article`);
    }
    validate(`leaks[${i}].articles`, leak.articles, ["url", "title", "date"]);
    leak.articles.sort(byDateDesc);
  });
  leaks.sort((a, b) => latest(b).localeCompare(latest(a))); // newest first; ties keep file order

  const articles = json("data/articles.json");
  validate("articles", articles, ["url", "title", "image", "date"]);
  articles.sort(byDateDesc);

  let html = read("index.html");
  html = replaceBetween(html, "leaks", leaks.map(leakCard).join(""));
  html = replaceBetween(html, "articles", articles.map(articleCard).join(""));
  html = html.replace(
    /(<span class="metric-value" data-build="leak-count">)[^<]*(<\/span>)/,
    `$1${leaks.length}+$2`
  );
  writeFileSync("index.html", html);
  console.log(`render: ${leaks.length} leaked products, ${articles.length} articles`);
}

async function minify() {
  for (const [entry, loader] of [["mcu/script.js", "js"], ["mcu/style.css", "css"]]) {
    const before = read(entry).length;
    const result = await build({
      entryPoints: [entry],
      loader: { [`.${loader}`]: loader },
      minify: true,
      write: false,
      legalComments: "none",
      logLevel: "warning"
    });
    const output = result.outputFiles[0].text;
    writeFileSync(entry, output);
    console.log(`minify: ${entry} ${before} -> ${output.length} bytes`);
  }
}

function stamp() {
  const swPath = "mcu/sw.js";
  const sw = read(swPath);
  const shell = [...sw.matchAll(/"(\/[^"]+)"/g)].map(match => match[1]);
  const hash = createHash("sha256");
  for (const url of shell) {
    // Directory URLs ("/mcu/") are served by their index.html, which is listed separately.
    const file = url.slice(1);
    if (!url.endsWith("/") && existsSync(file)) hash.update(file).update(readFileSync(file));
  }
  const version = hash.digest("hex").slice(0, 10);
  const updated = sw.replace(/(const CACHE_VERSION = "mcu-viewing-order-)[^"]*(")/, `$1${version}$2`);
  if (updated === sw && !sw.includes(version)) throw new Error("CACHE_VERSION not found in mcu/sw.js");
  writeFileSync(swPath, updated);
  console.log(`stamp: mcu cache version ${version}`);
}

const steps = { render, minify, stamp };
const command = process.argv[2];
if (command === "all") {
  render();
  await minify();
  stamp();
} else if (steps[command]) {
  await steps[command]();
} else {
  console.error("usage: node scripts/build.mjs <render|minify|stamp|all>");
  process.exit(1);
}
