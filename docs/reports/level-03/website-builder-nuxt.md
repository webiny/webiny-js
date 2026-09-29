# @webiny/website-builder-nuxt

> Level 3 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
This is the Nuxt 3 integration layer for `@webiny/website-builder-vue`: it re-exports the Vue binding's whole public API unchanged, wires up a Nuxt-specific headers provider (built on `useRequestHeaders()` from the Nuxt virtual `#imports` module, with `X-Preview-Params` synthesized from `wb.*` query params), and ships a Vite plugin (`injectThemeCss`) as a separate entry point for build-time theme-CSS injection. Its own `DocumentRenderer.ts` is a one-line re-export of the Vue package's `DocumentRenderer` — the package deliberately adds no rendering logic of its own. Health is fair for what little source it has (small, clone-free), but compared directly against its Next.js sibling it is missing an entire request-time middleware layer: `website-builder-nextjs` ships a `middleware` entry point that handles preview/draft-mode routing and persists the SDK's A/B-testing visitor cookie (`wb_ab_vid`), and this package has no Nuxt/Nitro equivalent at all, nor any host-app guidance for how to replicate that behavior. It is also the only one of the two packages with zero tests.

## Public API
- `DocumentRenderer` (`src/DocumentRenderer.ts:12`) — re-exports `@webiny/website-builder-vue`'s `DocumentRenderer` unchanged; the file's own comment states the package intentionally adds no Nuxt-specific rendering (no built-in `<NuxtImg>`-backed Image override, unlike the Next.js sibling's `next/image`-backed one — this is explicitly documented as opt-in via the `components` prop, not an oversight).
- `injectThemeCss` (`src/vite.ts:48`) — a separate `./vite` entry point, the Vite/Nuxt equivalent of `website-builder-nextjs/src/webpack.ts`'s helper of the same name; no in-repo consumers, meant for host `nuxt.config.ts` usage.
- Everything from `@webiny/website-builder-vue` is re-exported via `export * from "@webiny/website-builder-vue"` (`src/index.ts:1`), including that package's own store-keying inconsistency (Vue keys `documentStoreManager` by `document.id` vs. React's `document.properties.id`, per the level-2 `website-builder-vue` report) — this package does not add to or fix that drift, it simply inherits it unchanged.

## Bugs
None found in this package's own code. The one concrete cross-framework gap — missing preview/draft-mode and A/B-cookie middleware, present in `website-builder-nextjs` but absent here — is a feature-parity gap rather than a code defect with a specific broken line, so it is listed under Recommendations rather than as a bug row.

## Duplication
`src/vite.ts`'s `buildThemeCss` (read CSS file, inline `@import`s via `postcss-import`) duplicates `website-builder-nextjs/src/webpack.ts`'s function of the same name almost verbatim; see that package's report for the same finding from the other side.

## Dead code
None found. `injectThemeCss` has no in-repo consumers but is a documented public entry point for external Nuxt host apps (confirmed via `package.json`'s `exports` map), not orphaned code.

## Convention issues
None found worth flagging — the package's source is minimal (three small files) and does not exhibit the DI-naming, barrel-export, or inline-type issues called out elsewhere in this audit.

## Test gaps
The package has no `__tests__` directory at all. Nothing here is independently tested: not `injectThemeCss`'s dev-mode file-watch/restart behavior, nor the headers-provider's `X-Preview-Params` synthesis from `wb.*` query parameters (`src/index.ts:18-23`), which has no equivalent coverage anywhere else since the logic is Nuxt-specific.

## Recommendations
1. Add a Nuxt/Nitro server-middleware equivalent of `website-builder-nextjs`'s `createWebsiteBuilderMiddleware` (preview/draft-mode handling and persisting the SDK's A/B visitor cookie), or explicitly document in this package that host apps must hand-roll that logic themselves in a Nitro server middleware — right now there is no code and no documented guidance for either, unlike the Next.js sibling which ships a working default.
2. Add tests for the headers provider's `X-Preview-Params` synthesis and for `injectThemeCss`'s watch/rebuild path, since the package currently has none.
3. Extract the shared `buildThemeCss` logic into a common helper reused by both `website-builder-nuxt/src/vite.ts` and `website-builder-nextjs/src/webpack.ts` instead of maintaining two near-identical copies.
