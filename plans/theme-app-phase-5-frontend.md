# Theme App — Phase 5: Frontend Consumption

Status: **in progress** — Slices 1–6 done; only Slice 7 (Lexical, needs a decision) remains. Written
2026-08-05, after merging `next`
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
  const active = await sdk.theme.getActiveTheme(); // null when no theme is active
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

### Slice 2 — same-origin rewrite + caching ✅ DONE (2026-08-05)

Kept entirely in `@webiny/theme-sdk` (no change to the WB-owned `-nextjs` package):

- `ThemeSdkConfig.sameOrigin?: boolean` — when set, `getActiveTheme` emits the artifact URLs **relative**
  instead of absolute, so the browser fetches same-origin (CDN-cached under the site domain). Off by
  default; absolute URLs keep working with no proxy. Threaded through `sdk-frontend`'s `ThemeConfig`.
- `createThemeRewrite(apiHost): ThemeRewriteRule` — a ready `{ source, destination }` proxy rule for
  `next.config` `rewrites()`, plus the `THEME_ROUTE_PREFIX` constant. Covers the active pointer and the
  artifacts under one wildcard.

Usage:

```js
// next.config.js
const { createThemeRewrite } = require("@webiny/sdk-frontend");
module.exports = {
  async rewrites() {
    return [createThemeRewrite(process.env.WEBINY_API_URL)];
  }
};
// + sdk.init({ …, theme: { sameOrigin: true } })
```

5 new tests (18 total). Nuxt's equivalent route rule (same `source`/`destination`, `**` wildcard) lands
in Slice 6.

### Slice 3 — font emission ✅ DONE (2026-08-05)

Fonts live in the JSON artifact body (not the pointer) and are Google-Fonts-only in v1, so:

- `ThemeSdk.getFonts(active)` — a second fetch of the theme's `tokens.json`, extracting `fonts[]` into a
  minimal `ThemeFont[]` (family/weights/styles/display). Always fetched at an absolute URL even in
  same-origin mode (SSR fetch needs an origin). Defensive parse — malformed font entries dropped;
  never throws (any failure → `[]`, so the page falls back to system fonts).
- `buildGoogleFontsUrl(fonts)` — one `css2` URL for all families/weights, sorted `ital,wght` tuples when
  italic is used, `display=swap`.
- `getFontLinkTags(fonts)` — `preconnect` to both Google origins (`gstatic` with `crossorigin`, or the
  preconnect is wasted) + the stylesheet `<link>`. `ThemeLinkTag` broadened to carry
  `crossOrigin`/`as`/`type`.

Layout adds the fonts alongside the token CSS:

```tsx
const active = await sdk.theme.getActiveTheme();
const fonts = active ? await sdk.theme.getFonts(active) : [];
// in <head>:
{
  [...getThemeLinkTags(active), ...getFontLinkTags(fonts)].map(tag => (
    <link key={tag.href} {...tag} />
  ));
}
```

14 new tests (32 total). Kept in `@webiny/theme-sdk`, dependency-free (minimal structural `ThemeFont`
rather than importing `@webiny/theme-common`).

### Slice 4 — revalidation on publish/activate ✅ DONE (2026-08-05)

Investigation: theme webhooks use the **Standard Webhooks** spec (`standardwebhooks` lib, headers
`webhook-id` / `webhook-timestamp` / `webhook-signature`; the constants comment even says the customer
wires `theme.activated` "to the SDK's revalidation handler"). Only `theme.activated` /
`theme.deactivated` change what is live — published versions are immutable, drafts never touch delivery.

Signature verification needs a crypto lib and cache purge is framework-specific, so neither belongs in
the zero-dep isomorphic client. The **reusable, testable core** is in `@webiny/theme-sdk`; the verifying
handler is a documented recipe (below).

- `THEME_CACHE_TAG = "webiny-theme"` — tag the theme fetches with it, revalidate it from the handler.
- `shouldRevalidateTheme(eventName)` — pure decision: true only for activate/deactivate.
- `THEME_REVALIDATE_EVENTS`, and the `ThemeWebhookPayload` / `ThemeActivationWebhookPayload` types.
- `ThemeSdkConfig.requestInit` — extra `RequestInit` merged into every theme fetch (framework-agnostic),
  so a Next app tags the fetch for `revalidateTag`. The client's abort signal always wins over it, so
  the timeout can't be lost.

Config so the fetch is cacheable + tagged:

```ts
sdk.init({ …, theme: { requestInit: { next: { tags: [THEME_CACHE_TAG], revalidate: 3600 } } } });
```

Next.js route handler (the customer writes this — it needs `standardwebhooks` + `next/cache`):

```ts
// app/api/webiny/theme-webhook/route.ts
import { Webhook } from "standardwebhooks";
import { revalidateTag } from "next/cache";
import { shouldRevalidateTheme, THEME_CACHE_TAG } from "@webiny/sdk-frontend";

export async function POST(req: Request) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers);
  try {
    new Webhook(process.env.WEBINY_THEME_WEBHOOK_SECRET!).verify(body, headers); // throws if invalid
  } catch {
    return new Response("invalid signature", { status: 401 });
  }
  const { event } = JSON.parse(body);
  if (shouldRevalidateTheme(event)) {
    revalidateTag(THEME_CACHE_TAG);
  }
  return new Response(null, { status: 204 });
}
```

Then add a webhook in Admin for `theme.activated` + `theme.deactivated` pointing at that route.

8 new tests (37 total). A turnkey handler could later live in a `theme-nextjs` package; kept as a recipe
for now to avoid pulling `standardwebhooks` + `next` into the framework-agnostic client.

### Slice 5 — Tailwind adapter `@webiny/theme-tailwind` ✅ DONE (2026-08-05)

Key simplification found while building: the canonical token set is **fixed and known**
(`CANONICAL_SLOTS`), so the preset is **static and needs no build-time JSON fetch** — Tailwind only
needs the _names_ mapped to `var(--wby-*)`, and the values arrive from `tokens.css` at runtime. So a
theme swap re-colours every utility with no rebuild.

New package `@webiny/theme-tailwind` (depends on `@webiny/theme-common`; build-time only, so **not**
re-exported from the runtime `sdk-frontend` — that would pull zod into the app bundle):

- `webinyThemeTokens()` → `{ colors, spacing, fontSize, borderRadius, boxShadow }`, each key mapped to
  its `var(--wby-*)`. Routed by path prefix (`color`→colors, `space`→spacing, `text`→fontSize,
  `radius`→borderRadius, `shadow`→boxShadow) — prefix, not `$type`, because `space`/`text`/`radius` are
  all `dimension`-typed but three different scales. Composite `type.*` roles excluded (they are the
  rich-text/structural typography, not a single Tailwind scale).
- `webinyThemePreset()` → `{ theme: { extend: … } }` for `presets: [webinyThemePreset()]`.

```js
// tailwind.config.js
const { webinyThemePreset } = require("@webiny/theme-tailwind");
module.exports = { presets: [webinyThemePreset()], content: [...] };
// → bg-surface-page, text-primary, p-md, rounded-sm, shadow-md all resolve to the active theme.
```

9 tests, derived from `CANONICAL_SLOTS` so they can't drift from the token set.

### Slice 6 — Vue/Nuxt parity ✅ DONE (2026-08-05)

Because the whole client is framework-agnostic, most of the parity was already there — Nuxt gets
`getActiveTheme`/`getFonts`/`getThemeLinkTags`/`getFontLinkTags`, `sameOrigin`, `requestInit`,
`shouldRevalidateTheme`/`THEME_CACHE_TAG` and the Tailwind preset (Slice 5) unchanged. The only shape
that differed was the proxy, so:

- `createNuxtThemeRouteRules(apiHost): ThemeNuxtRouteRules` — the Nitro `routeRules` equivalent of
  `createThemeRewrite`. Same routes, `**` wildcard instead of `:path*`. A parity test asserts the two
  target identically, differing only in wildcard syntax.

Nuxt recipes (mirroring the Next ones above):

```ts
// nuxt.config.ts — same-origin proxy
import { createNuxtThemeRouteRules } from "@webiny/sdk-frontend";
export default defineNuxtConfig({
  routeRules: { ...createNuxtThemeRouteRules(process.env.WEBINY_API_URL!) }
});
// + sdk.init({ …, theme: { sameOrigin: true } })
```

```ts
// app.vue / layouts/default.vue — <head> injection via useHead
const active = await sdk.theme.getActiveTheme();
const fonts = active ? await sdk.theme.getFonts(active) : [];
useHead({
  link: [...getThemeLinkTags(active), ...getFontLinkTags(fonts)].map(tag => ({
    rel: tag.rel,
    href: tag.href,
    crossorigin: tag.crossOrigin,
    as: tag.as,
    type: tag.type
  }))
});
```

```ts
// server/api/webiny/theme-webhook.post.ts — revalidation (needs standardwebhooks)
import { Webhook } from "standardwebhooks";
import { shouldRevalidateTheme, THEME_CACHE_TAG } from "@webiny/sdk-frontend";
export default defineEventHandler(async event => {
  const body = await readRawBody(event);
  try {
    new Webhook(process.env.WEBINY_THEME_WEBHOOK_SECRET!).verify(body!, getHeaders(event));
  } catch {
    throw createError({ statusCode: 401 });
  }
  if (shouldRevalidateTheme(JSON.parse(body!).event)) {
    // Nitro has no revalidateTag; purge the cached theme response from cache storage.
    await useStorage("cache").removeItem(`nitro:handlers:${THEME_CACHE_TAG}`);
  }
  return null;
});
```

Note the one casing difference the recipe handles: the tag helpers use React's `crossOrigin`; `useHead`
takes the HTML attribute `crossorigin`. 3 new tests (40 total).

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
