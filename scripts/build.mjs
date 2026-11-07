// Site build steps. Run from the repository root.
//
//   node scripts/build.mjs render    render data/*.json into index.html (commit the result)
//   node scripts/build.mjs minify    minify mcu/script.js and mcu/style.css in place (CI only)
//   node scripts/build.mjs releases  bake the latest AppleDB releases into the Hoardware release-alert demo (needs network)
//   node scripts/build.mjs stamp     set the MCU service worker cache version from a content hash (CI only)
//   node scripts/build.mjs all       render, releases, minify, stamp (what CI runs before deploying)
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

function cveCard(entry) {
  const links = (entry.fixed ?? []).map(link =>
    `<a href="${escapeHtml(link.url)}" ${EXTERNAL}>${escapeHtml(link.label)}</a>`).join(",\n              ");
  const fixed = [links, entry.fixedText ? escapeHtml(entry.fixedText) : ""].filter(Boolean).join(" ");
  const note = entry.note
    ? `<br />${entry.note.url ? `<a href="${escapeHtml(entry.note.url)}" ${EXTERNAL}>${escapeHtml(entry.note.text)}</a>` : escapeHtml(entry.note.text)}`
    : "";
  return `        <div class="cve-card">
          <div class="cve-card-header">
            <strong>${escapeHtml(entry.title)}</strong>
            <p class="fixed"><em>Fixed in:</em>
              ${fixed}${note}
            </p>
          </div>
          <div class="cve-details-wrap">
            <div class="cve-details">
              <p><em>Impact:</em> ${escapeHtml(entry.impact)}</p>
            </div>
          </div>
        </div>
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

  const cves = json("data/cves.json");
  validate("cves", cves, ["title", "impact"]);
  cves.forEach((cve, i) => {
    if ((cve.fixed ?? []).length === 0 && !cve.fixedText) throw new Error(`cves[${i}] (${cve.title}) needs "fixed" links or "fixedText"`);
  });

  let html = read("index.html");
  html = replaceBetween(html, "cves", cves.map(cveCard).join(""));
  html = html.replace(
    /(<span class="metric-value" data-build="cve-count">)[^<]*(<\/span>)/,
    `$1${cves.length}$2`
  );
  html = replaceBetween(html, "leaks", leaks.map(leakCard).join(""));
  html = replaceBetween(html, "articles", articles.map(articleCard).join(""));
  html = html.replace(
    /(<span class="metric-value" data-build="leak-count">)[^<]*(<\/span>)/,
    `$1${leaks.length}+$2`
  );
  writeFileSync("index.html", html);
  console.log(`render: ${leaks.length} leaked products, ${articles.length} articles, ${cves.length} CVEs`);
}


// ─── Hoardware release alerts demo ───
// The three notifications show the newest software AppleDB lists for each device: the latest beta
// when it is newer than the latest stable release, otherwise the stable release.
const ALERT_DEVICES = [
  { os: "iOS", id: "iPhone18,1", name: "iPhone 17 Pro" },
  { os: "macOS", id: "Mac17,2", name: "MacBook Pro 14-inch (M5)" },
  { os: "watchOS", id: "Watch7,12", name: "Apple Watch Ultra 3" }
];

function releaseKey(entry) {
  const version = String(entry.version);
  const numbers = (version.match(/^\d+(?:\.\d+)*/)?.[0] ?? "0").split(".").map(Number);
  while (numbers.length < 4) numbers.push(0);
  const beta = entry.beta === true || /beta/i.test(version);
  const rc = entry.rc === true || /\bRC\b/i.test(version);
  const rank = beta ? 1 : rc ? 2 : 3; // a final release outranks its own RCs, which outrank its betas
  const sequence = Number(version.match(/(?:beta|RC)\s*(\d+)/i)?.[1] ?? 1);
  return [...numbers, rank, sequence, entry.released ?? ""];
}

function compareKeys(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

function latestRelease(entries, device) {
  const candidates = entries.filter(entry =>
    entry.osStr === device.os && !entry.internal && !entry.sdk && (entry.deviceMap ?? []).includes(device.id));
  if (candidates.length === 0) return null;
  return candidates.reduce((best, entry) => (compareKeys(releaseKey(entry), releaseKey(best)) > 0 ? entry : best));
}

function alertTitle(entry) {
  const name = `${entry.osStr} ${entry.version}`;
  if (entry.beta === true || /beta/i.test(entry.version)) return `Beta released: ${name}`;
  if (entry.rc === true || /\bRC\b/i.test(entry.version)) return `Release candidate: ${name}`;
  return `Released: ${name}`;
}

async function releases() {
  const picked = [];
  try {
    for (const device of ALERT_DEVICES) {
      const response = await fetch(`https://api.appledb.dev/ios/${device.os}/main.json`);
      if (!response.ok) throw new Error(`${device.os}: HTTP ${response.status}`);
      const entry = latestRelease(await response.json(), device);
      if (!entry) throw new Error(`${device.os}: no release found for ${device.id}`);
      picked.push({ device, entry });
    }
  } catch (error) {
    console.warn(`releases: skipped (${error.message}); keeping the existing alerts`);
    return;
  }
  const alerts = picked.map(({ device, entry }) => `<div class="alert-example"><img src="/hoardware/icon-168.png" width="34" height="34" alt=""><span><b>${escapeHtml(alertTitle(entry))}</b><small>Available for ${escapeHtml(device.name)}</small></span></div>`).join("");
  const label = picked.map(({ device, entry }) => `${alertTitle(entry)} for ${device.name}`).join(", ");
  const stack = `<div class="alert-stack" role="img" aria-label="Example notifications: ${escapeHtml(label)}">${alerts}</div>\n`;
  const html = replaceBetween(read("hoardware/index.html"), "alerts", stack);
  writeFileSync("hoardware/index.html", html);
  console.log(`releases: ${picked.map(({ device, entry }) => `${device.os} ${entry.version}`).join(", ")}`);
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

const steps = { render, releases, minify, stamp };
const command = process.argv[2];
if (command === "all") {
  render();
  await releases();
  await minify();
  stamp();
} else if (steps[command]) {
  await steps[command]();
} else {
  console.error("usage: node scripts/build.mjs <render|minify|stamp|all>");
  process.exit(1);
}
