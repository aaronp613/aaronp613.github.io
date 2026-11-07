# aaronp613

## Follow me: 

* Twitter: https://twitter.com/aaronp613
* Discord: https://discord.gg/jb - Aaron#9999
* Reddit: u/aaronp613

## Development

The site is static, but a few pieces are generated. Requires Node 22+.

```sh
npm install
npm run build        # render data/leaks.json and data/articles.json into index.html
npm test             # Playwright smoke tests (first run: npm run test:install)
```

- **Leaked products, articles and CVEs** live in `data/leaks.json`, `data/articles.json` and `data/cves.json`.
  Add an entry, run `npm run build`, and commit `index.html` as well. Leak and article cards are sorted newest
  first, each leaked product lists its articles newest first, and the "products leaked" and "CVEs" stats are
  the number of entries. A CVE entry needs a `title`, an `impact`, and either `fixed` links or `fixedText`.
- **Card images** are served from `images/cards/` (640px wide WebP) instead of hotlinking MacRumors, which cut the
  homepage from about 2.4MB to about 0.6MB. For a new leak or article, put the MacRumors image address in
  `image`, run `node scripts/localize-images.mjs` (downloads, resizes, and points the entry at the local copy,
  keeping the original in `imageSource`), then `npm run build`.
- **Hoardware release alerts** (`/hoardware/`): the three demo notifications show the newest software AppleDB
  lists for an iPhone 17 Pro, MacBook Pro 14-inch (M5) and Apple Watch Ultra 3, the latest beta when it is newer
  than the latest stable release, otherwise the stable one. `npm run build:ci` (or `node scripts/build.mjs releases`)
  bakes them into the page; CI does this on every deploy and every 6 hours. If AppleDB can't be reached the
  existing text is kept.
- **CI** (`.github/workflows/pages.yml`) re-renders the data, minifies `mcu/script.js` and `mcu/style.css`,
  stamps `mcu/sw.js` with a content hash (so the service worker cache refreshes on every change), runs the
  smoke tests against those built files, then deploys. None of those CI-only changes are committed, so don't
  commit minified files or a stamped `sw.js`.
