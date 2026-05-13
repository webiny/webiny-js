# Dependencies Overview

See `common.md`, `react.md`, `node.md` for full details per package.

## Replace (clear wins)

- Apollo v2 suite (10 packages) → `@apollo/client` v3
- `cross-fetch` → native `fetch` (built-in Node 18+)
- `uuid`, `uniqid`, `bson-objectid` → `crypto.randomUUID()` or `nanoid` (already in deps)
- `crypto-hash` → `crypto.subtle.digest()` (built-in)
- `ncp` → `fs.cpSync`, `rimraf` → `fs.rmSync`, `os` → `node:os` (all built-in Node 22+)
- `jsonwebtoken` → `jose` (already in deps)
- ~~`webpack` + 7 loaders → rspack/rsbuild~~ ✅ done (rslib migration complete; `babel-loader`, `@svgr/webpack`, `@types/webpack-env`, `@emotion/babel-plugin` removed)
- `react-dnd` + `dnd-core` → `@dnd-kit/core`
- `react-virtualized` → `@tanstack/react-virtual`
- `react-helmet` → `react-helmet-async`
- `react-color` → `react-colorful`
- `react-custom-scrollbars` → `@radix-ui/react-scroll-area` (already in deps)
- `classnames` → `clsx` (already in deps)
- `prop-types` → remove (TypeScript handles it)
- `regenerator-runtime` → remove if modern browser targets (polyfills async/await and generators)
- `invariant`, `ts-invariant`, `warning`, `boolean` → inline (no package needed)
- `ttypescript` → `ts-patch` (maintained fork)
- `get-yarn-workspaces` → `find-workspaces` (supports yarn/npm/pnpm/lerna/bolt)
- `load-json-file`, `write-json-file` → one-liner with `node:fs`
- `decompress` → `adm-zip` (already in deps) or `tar` (already in deps)
- `fecha` → `date-fns` (already in deps)
- `jsonpack` → `JSON.stringify` + compression or `msgpackr`
- `accounting` → `Intl.NumberFormat` (built-in)
- `deep-equal` → `node:util` `isDeepStrictEqual`
- `dot-prop-immutable` → `structuredClone()` + `dot-prop` (already in deps)
- `fast-json-stable-stringify` → `safe-stable-stringify`
- ~~`babel-plugin-dynamic-import-node`~~ ✅ done; `raw.macro` → still needs removal (obsolete Babel macro pattern)
- `react-lazy-load` → native `IntersectionObserver`
- `react-transition-group` → CSS transitions or `framer-motion`

## Reduce (partially replaceable)

- `lodash` → most utils native in ES2024+ (`structuredClone`, `Object.groupBy`, etc.)
- `core-js` → audit usage, Node 22+ has most polyfills natively
- `fs-extra` → Node 22+ covers `cp`, `rm`, `mkdir` recursively
- `dotenv` → Node 22+ `--env-file` flag
- `dayjs` → redundant with `date-fns` (already in deps)
- `object-merge-advanced` → `deepmerge` (already in deps)
- `@emotion/*` → overlaps with Tailwind CSS long-term
- `reset-css` → Tailwind preflight already resets
- `cross-env` → Node 22+ `--env-file` or inline env
