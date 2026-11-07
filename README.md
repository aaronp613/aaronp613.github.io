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

- **Leaked products and articles** live in `data/leaks.json` and `data/articles.json`. Add an entry, run
  `npm run build`, and commit `index.html` as well. Cards are sorted newest first, each leaked product
  lists its articles newest first, and the "products leaked" stat is the number of entries.
- **CI** (`.github/workflows/pages.yml`) re-renders the data, minifies `mcu/script.js` and `mcu/style.css`,
  stamps `mcu/sw.js` with a content hash (so the service worker cache refreshes on every change), runs the
  smoke tests against those built files, then deploys. None of those CI-only changes are committed, so don't
  commit minified files or a stamped `sw.js`.
