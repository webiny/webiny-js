# Theme App — Phase 5: Frontend Consumption

Status: **in progress** (Slice 1 = tracer bullet). Written 2026-08-05, after merging `next`
(which brought the frontend SDK: `@webiny/sdk-frontend`, `website-builder-react/-nextjs/-vue/-nuxt`,
`react-rich-text-lexical-renderer`).

## Goal

Make a _published, active_ theme actually render on the customer's own frontend. Today themes are
produced and delivered but nothing on the live site reads them.

## What is already done (producer side — do NOT rebuild)

Confirmed complete and publicly deliverable by investigation:

- `GET /_webiny/theme/active` (`api-theme` `ActiveThemeRoute`) → JSON **pointer**:
  `{ active, themeId, version, activatedOn, artifacts: { css, json } }`, or `{ active: false }` (a 200,
  never a 404). `cache-control: public, max-age=60, stale-while-revalidate=300`. Artifact URLs are
  **relative** (`/_webiny/theme/<id>/<v>/tokens.css`), assuming a same-origin rewrite.
- `GET /_webiny/theme/<id>/<v>/tokens.css|tokens.json` (`ThemeArtifactRoute`) → the bytes.
  Published version → `public, max-age=31536000, immutable`; draft → `no-store` and permission-gated
  (404, not 403). Content types `text/css` / `application/json`.
- Both routes wired into API Gateway (`createApiPulumiApp.ts` `theme-artifacts-*` for
  `/_webiny/theme/{path+}`) behind CloudFront, **no authorizer** — published/active is genuinely public.
- `generateCssArtifact` emits `:root { --wby-*: … }`, `[data-wby-theme-mode="dark"]`, a
  `prefers-color-scheme` block per `policy.defaultMode`, and fluid `clamp()`s. Prefix is `--wby-`.

## The key fact that makes this small

Every published WB element **already emits `var(--wby-*, fallback)`** inline (via `LiveElementRenderer`
`style={…}` → `tokenToCssValue`). So the whole job of a published theme is to **define those variables
on `:root`**. Nothing does that today, so every reference currently falls back. Producer and consumer
already agree on the `--wby-` prefix — they have simply never been connected.

`DocumentRenderer` (react + nextjs) deliberately owns **no `<head>`** — it renders a `<div>` subtree.
So `:root` injection belongs to the **framework adapter / customer layout**, not the renderer. The
React renderer needs no change; its inline `var()` is host-agnostic and resolves the instant any
ancestor `:root` stylesheet is present.

## Architectural seam (from investigation)

- `@webiny/sdk-frontend` is a **singleton** (`sdk.init(config)`), a **closed** method set. It composes
  per-domain SDKs: `new Webiny(...)`, `cmsContentSdk.init(...)`, `wbContentSdk.init(...)`, and exposes
  `get cms()` / `get wb()`. There is **no plugin bus**. Adding a domain = mirror this composition.
- `ContentSdkConfig` already reserves per-domain slices (`cms?`, `wb?`); `CmsConfig` is literally an
  empty "extension point" interface. Adding `theme?` follows the blessed convention.
- Transport is REST for artifacts (the api-theme routes were purpose-built around it); an authenticated
  REST `GET` shape already exists in `website-builder-sdk`'s `ApiClient.fetch()`.

---

## Slices (tracer-bullet order)

### Slice 1 — TRACER BULLET: active-theme fetch + head injection ✅ DONE (2026-08-05)

Built: `@webiny/theme-sdk` (`ThemeSdk.getActiveTheme()`, `getThemeLinkTags()`, absolute-URL
resolution, 5s SSR timeout, null-on-any-failure), 13 unit tests. Wired into `@webiny/sdk-frontend`
(`theme?` config slice, `get theme()`, constructed in `init`; re-exported from the barrel). All
preflight green. Layout usage:

```tsx
// app/layout.tsx (Next.js, RSC)
import { sdk, getThemeLinkTags } from "@webiny/sdk-frontend";

export default async function RootLayout({ children }) {
    const active = await sdk.theme.getActiveTheme();          // null when no theme is active
    return (
        <html>
            <head>
                {getThemeLinkTags(active).map(tag => (
                    <link key={tag.href} rel={tag.rel} href={tag.href} />
                ))}
            </head>
            <body>{children}</body>
        </html>
    );
}
```

**Outcome:** publish → activate a theme → a live page's `:root` carries the theme variables, so every
WB element renders themed colours/spacing/type/shadows. End-to-end vertical slice.

1. **New package `@webiny/theme-sdk`** (framework-agnostic client, zero runtime deps):
   - `ThemeSdk` class, constructed with `{ apiHost, apiKey?, apiTenant?, fetch? }`.
   - `getActiveTheme(): Promise<ActiveTheme | null>` — `GET ${apiHost}/_webiny/theme/active`, auth
     headers when a key is given, returns `null` on `{active:false}` or any failure (a themeless site
     must never throw). **Resolves the relative artifact URLs to absolute** (`${apiHost}${path}`) so a
     browser `<link>` works with no rewrite yet (Slice 2 adds the same-origin optimisation).
   - `getThemeLinkTags(active): { href: string; rel: "stylesheet" }[]` — pure helper producing the
     head-tag data a layout renders. Framework-agnostic (no JSX), so Next/Nuxt/React all use it.
   - Types: `ActiveTheme`, `ThemeArtifactUrls`.
   - Tests (mock fetch): active → resolved absolute URLs; `{active:false}` → null; network/HTTP error
     → null (never throws); URL resolution; auth headers present/absent.
2. **Wire into `@webiny/sdk-frontend`:** `ThemeConfig` slice on `ContentSdkConfig`, construct
   `new ThemeSdk({...})` in `FrontendSdk.init`, add `get theme(): ThemeSdk`. ~4 edits.
3. **Docs/usage:** the customer's Next.js root layout calls `await sdk.theme.getActiveTheme()` at SSR
   and renders `<link rel="stylesheet" href={css}>` in `<head>`. (A turnkey `<WebinyThemeStyles/>` RSC
   can come later; the primitive is enough to prove the slice.)

**Acceptance:** `theme-sdk` unit tests green; `sdk-frontend` builds and typechecks with the new getter;
a documented 3-line layout snippet that, given an active theme, emits the correct absolute `<link>`.

### Slice 2 — same-origin rewrite + caching

Add the `/_webiny/theme/*` frontend rewrite (Next middleware / `next.config` rewrite, Nuxt route rule)
so the browser fetches artifacts from the site origin (CDN-cached, immutable) instead of cross-origin.
Then `getActiveTheme` can emit the relative URL. Optional but matches the original delivery design.

### Slice 3 — font emission

The JSON artifact carries `fonts` "so the SDK can emit preload hints". Add `getFontLinkTags(active)` and
fetch the JSON artifact when fonts are needed. Preconnect/preload in `<head>`.

### Slice 4 — revalidation on publish/activate

Server webhook handlers already fire (`OnThemePublished/Activated/Deactivated`). Add a frontend
subscriber/endpoint that invalidates the 60s active pointer (ISR `revalidateTag` / cache purge) so a
newly-activated theme reaches the live site promptly rather than after TTL.

### Slice 5 — Tailwind adapter `@webiny/theme-tailwind`

Map the **canonical** `--wby-*` tokens (the JSON artifact flags which) into a Tailwind theme config, so
Tailwind users get the theme as utility classes. Consumes the JSON artifact.

### Slice 6 — Vue/Nuxt parity

Mirror Slice 1/2 for `website-builder-nuxt` (Vite `__THEME_CSS__` twin, same `<head>` story). The client
`@webiny/theme-sdk` is framework-agnostic, so only the injection host differs.

### Slice 7 — Lexical structural class alignment (needs a decision first)

**Blocked on a decision, not on code.** `generateLexicalCss`/`createLexicalThemeClasses` (built + tested
in `theme-common`) emit `wby-rt-*` classes, but WB renders stored rich-text as pre-baked HTML carrying
`wb-lx-*` / `wb-paragraph-*` classes, and the shipped `lexical.css` still references the _old_
`--wb-theme-*` variables. So the class-map as-built targets nothing on the frontend.

Options:

- **(a)** Re-point the theme class-map + `generateLexicalCss` at the `wb-lx-*` / `wb-paragraph-*` names
  WB already emits, and migrate `lexical.css` to `--wby-*`. Cheap; no WB-runtime change.
- **(b)** Change WB's rich-text HTML generation to emit `wby-rt-*` via `EditorThemeClasses`. Bigger;
  needs coordination with the WB team; cleaner long-term namespace.

Recommendation: **(a)** for now — it aligns with what already ships and unblocks rich-text theming
without a cross-team change. Revisit (b) if the `wb-*`→`wby-*` namespace migration happens wholesale.

---

## Open decisions

1. **Slice 7 (a) vs (b)** — above. Parked until Slice 1 lands.
2. **Package boundary** — resolved: `@webiny/theme-sdk` as a standalone framework-agnostic client
   (matches `cms-sdk`/`website-builder-sdk` per-domain convention; reusable by the Tailwind adapter and
   every framework host). `sdk-frontend` wraps it.

## Out of scope (already descoped)

- Multi-tenant frontend host-header→tenant mapping. The adapter uses the SDK's single configured
  `apiTenant`, per the original brief descope.
- Component-library contract.
