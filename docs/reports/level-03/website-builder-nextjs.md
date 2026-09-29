# @webiny/website-builder-nextjs

> Level 3 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
This is the Next.js integration layer for `@webiny/website-builder-react`: it re-exports the React binding's whole public API, wires up a Next.js-specific `headers()`-based headers provider, overrides `DocumentRenderer` to auto-register a Next.js-optimized `Image` component (built on `next/image` with a custom loader for the SDK's asset-delivery URLs), and ships a standalone `middleware` (preview/draft-mode handling plus an A/B-testing visitor cookie) and a webpack helper (`injectThemeCss`) as separate entry points. It builds correctly on `website-builder-react`'s exported helpers (`getAssetUrl`, `getImageDimensions`, `getImageSrcSet`, `normalizeToAsset`, `createComponent`, `setHeadersProvider`) rather than reimplementing any of them, and its own source is small and clone-free. Overall health is fair: the package has zero automated tests, and — compared against its Nuxt sibling — it is the only one of the pair that ships a request-time `middleware` for preview mode and A/B bucketing, which is a real feature gap on the Nuxt side documented in that package's own report.

## Public API
- `DocumentRenderer` (`src/DocumentRenderer.tsx:7`) — wraps `website-builder-react`'s `DocumentRenderer`, auto-prepending the Next-specific `Image` component to whatever `components` the caller passes. This is the only override; everything else is re-exported unchanged via `export * from "@webiny/website-builder-react"` (`src/index.ts:1`).
- `createWebsiteBuilderMiddleware` / `middleware` / `config` (`src/middleware.ts:38,102,105`) — a separate `./middleware` entry point; no in-repo consumers (it is meant to be dropped into a host Next.js app's own `middleware.ts`, per its file-header comment).
- `injectThemeCss` (`src/webpack.ts:23`) — a separate `./webpack` entry point providing a webpack `DefinePlugin`-based theme-CSS injector; no in-repo consumers, external host-app usage only.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | packages/website-builder-nextjs/src/middleware.ts | Security finding SEC-7 — see private notes. | — | medium |

## Duplication
`src/webpack.ts`'s `buildThemeCss` (reads a CSS file, inlines `@import`s via `postcss-import`, returns the resulting CSS string) is duplicated almost verbatim in `website-builder-nuxt/src/vite.ts`'s `buildThemeCss`. Both `injectThemeCss` wrappers also duplicate the same "watch the entry file, rebuild on change" pattern (webpack's `afterCompile`/`beforeCompile` hooks vs. Vite's `configureServer`/`watcher.on("change")`), which is expected given the different plugin systems, but the CSS-building core could be shared (e.g. in `website-builder-sdk` or a small shared helper) instead of being copy-pasted between the two framework packages.

## Dead code
None found. Both the `middleware` and `webpack` entry points, though unused within this monorepo, are documented public entry points intended for external host-app consumption (confirmed via `package.json`'s `exports` map), not orphaned code.

## Convention issues
- `src/editorComponents/Image.tsx:11` defines `ImageProps` as `ComponentProps<{ title: string; altText: string; highPriority: boolean; image: Asset; }>` — an inline object type passed as a generic argument rather than a named interface, which the project's "no inline types" convention asks to avoid.

## Test gaps
The package has no `__tests__` directory at all (confirmed by directory listing), so none of the following are covered by automated tests: the `Image` component's branching logic (SVG passthrough, missing-dimensions fallback to a plain `<img>`, the `next/image` loader path), `createWebsiteBuilderMiddleware`'s preview-mode enter/exit and A/B cookie logic, or `injectThemeCss`'s dev-mode file-watch/rebuild path.

## Recommendations
1. See `docs/.reports/security.md` for the security finding and its fix.
2. Add tests for `Image.tsx`'s branch logic (missing asset, SVG, missing-dimensions fallback, `next/image` happy path) and for `createWebsiteBuilderMiddleware`'s preview-mode and cookie behavior, since this package currently has none.
3. Extract the shared `buildThemeCss` (CSS read + `postcss-import` inlining) logic into a common helper reused by both `website-builder-nextjs/src/webpack.ts` and `website-builder-nuxt/src/vite.ts` instead of maintaining two copies.
